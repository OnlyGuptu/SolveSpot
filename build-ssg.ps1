<#
.SYNOPSIS
    Static Site Generator (SSG) for SolveSpot (https://solvespot.in)
    Pre-renders all subjects, book parts, branches, chapters, exercise sets,
    and policy pages into static index.html files with full SEO metadata and Q&A HTML.
#>

$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

public class JsValue {
    public string Type;
    public Dictionary<string, JsValue> Obj;
    public List<JsValue> Arr;
    public string Str;
    public bool Bool;
    public double Num;

    public JsValue this[string key] {
        get {
            if (Obj != null && Obj.ContainsKey(key)) return Obj[key];
            return null;
        }
        set {
            if (Obj == null) Obj = new Dictionary<string, JsValue>();
            Obj[key] = value;
        }
    }
    public string GetStr(string key, string def = "") {
        var v = this[key];
        return (v != null && v.Type == "string" && v.Str != null) ? v.Str : def;
    }
    public bool GetBool(string key, bool def = false) {
        var v = this[key];
        return (v != null && v.Type == "bool") ? v.Bool : def;
    }
    public List<JsValue> GetArr(string key) {
        var v = this[key];
        return (v != null && v.Type == "array") ? v.Arr : null;
    }
}

public class JsParser {
    private string src;
    private int pos;
    private int len;

    public JsParser(string s) {
        src = s;
        pos = 0;
        len = s.Length;
    }

    private void SkipWhitespaceAndComments() {
        while (pos < len) {
            char c = src[pos];
            if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
                pos++;
            } else if (c == '/' && pos + 1 < len && src[pos + 1] == '/') {
                pos += 2;
                while (pos < len && src[pos] != '\n') pos++;
            } else if (c == '/' && pos + 1 < len && src[pos + 1] == '*') {
                pos += 2;
                while (pos + 1 < len && !(src[pos] == '*' && src[pos + 1] == '/')) pos++;
                pos += 2;
            } else {
                break;
            }
        }
    }

    public JsValue ParseValue() {
        SkipWhitespaceAndComments();
        if (pos >= len) return null;
        char c = src[pos];
        if (c == '{') return ParseObject();
        if (c == '[') return ParseArray();
        if (c == '"' || c == '\'' || c == '`') return new JsValue { Type = "string", Str = ParseString() };
        if (c == '-' || (c >= '0' && c <= '9')) return ParseNumber();
        string ident = ParseIdentifier();
        if (ident == "true") return new JsValue { Type = "bool", Bool = true };
        if (ident == "false") return new JsValue { Type = "bool", Bool = false };
        if (ident == "null" || ident == "undefined") return new JsValue { Type = "null" };
        return new JsValue { Type = "string", Str = ident };
    }

    private JsValue ParseObject() {
        var obj = new Dictionary<string, JsValue>();
        pos++;
        while (pos < len) {
            SkipWhitespaceAndComments();
            if (pos < len && src[pos] == '}') {
                pos++;
                break;
            }
            string key = "";
            char c = src[pos];
            if (c == '"' || c == '\'' || c == '`') {
                key = ParseString();
            } else {
                key = ParseIdentifier();
            }
            SkipWhitespaceAndComments();
            if (pos < len && src[pos] == ':') pos++;
            JsValue val = ParseValue();
            obj[key] = val;
            SkipWhitespaceAndComments();
            if (pos < len && src[pos] == ',') pos++;
        }
        return new JsValue { Type = "object", Obj = obj };
    }

    private JsValue ParseArray() {
        var arr = new List<JsValue>();
        pos++;
        while (pos < len) {
            SkipWhitespaceAndComments();
            if (pos < len && src[pos] == ']') {
                pos++;
                break;
            }
            JsValue val = ParseValue();
            arr.Add(val);
            SkipWhitespaceAndComments();
            if (pos < len && src[pos] == ',') pos++;
        }
        return new JsValue { Type = "array", Arr = arr };
    }

    private string ParseString() {
        char quote = src[pos++];
        StringBuilder sb = new StringBuilder();
        while (pos < len) {
            char c = src[pos++];
            if (c == quote) break;
            if (c == '\\' && pos < len) {
                char esc = src[pos++];
                switch (esc) {
                    case 'n': sb.Append('\n'); break;
                    case 'r': sb.Append('\r'); break;
                    case 't': sb.Append('\t'); break;
                    case '\\': sb.Append('\\'); break;
                    case '"': sb.Append('"'); break;
                    case '\'': sb.Append('\''); break;
                    case '`': sb.Append('`'); break;
                    case 'u':
                        if (pos < len && src[pos] == '{') {
                            pos++;
                            int start = pos;
                            while (pos < len && src[pos] != '}') pos++;
                            string hex = src.Substring(start, pos - start);
                            if (pos < len) pos++;
                            sb.Append(char.ConvertFromUtf32(Convert.ToInt32(hex, 16)));
                        } else if (pos + 4 <= len) {
                            string hex = src.Substring(pos, 4);
                            pos += 4;
                            sb.Append((char)Convert.ToInt32(hex, 16));
                        }
                        break;
                    default:
                        sb.Append(esc);
                        break;
                }
            } else {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }

    private string ParseIdentifier() {
        int start = pos;
        while (pos < len) {
            char c = src[pos];
            if (char.IsLetterOrDigit(c) || c == '_' || c == '$') pos++;
            else break;
        }
        return src.Substring(start, pos - start);
    }

    private JsValue ParseNumber() {
        int start = pos;
        if (src[pos] == '-') pos++;
        while (pos < len && (char.IsDigit(src[pos]) || src[pos] == '.')) pos++;
        double d = 0;
        double.TryParse(src.Substring(start, pos - start), out d);
        return new JsValue { Type = "number", Num = d, Str = src.Substring(start, pos - start) };
    }
}

public class SsgBuilder {
    private string rootDir;
    private string masterTemplate;
    private JsValue db;
    private Encoding utf8NoBom = new UTF8Encoding(false);
    public List<string> GeneratedRoutes = new List<string>();
    public int TotalFilesWritten = 0;

    public SsgBuilder(string workspaceDir, string templateHtml, JsValue database) {
        rootDir = workspaceDir;
        masterTemplate = templateHtml;
        db = database;
        NormalizeDatabaseExercises();
    }

    private void NormalizeDatabaseExercises() {
        foreach (var kv in db.Obj) {
            var subData = kv.Value;
            var chapterLists = new List<List<JsValue>>();
            if (subData.GetBool("isBranching") && subData.GetArr("branches") != null) {
                foreach (var b in subData.GetArr("branches")) {
                    var chs = b.GetArr("chapters");
                    if (chs != null) chapterLists.Add(chs);
                }
            } else if (subData.GetArr("chapters") != null) {
                chapterLists.Add(subData.GetArr("chapters"));
            }

            foreach (var chapters in chapterLists) {
                foreach (var chap in chapters) {
                    var exercises = chap.GetArr("exercises");
                    if (exercises != null && exercises.Count > 0) {
                        var flatSolutions = new List<JsValue>();
                        for (int exIdx = 0; exIdx < exercises.Count; exIdx++) {
                            var ex = exercises[exIdx];
                            string exId = ex.GetStr("id", "");
                            if (string.IsNullOrEmpty(exId)) {
                                exId = (exIdx + 1).ToString();
                                ex["id"] = new JsValue { Type = "string", Str = exId };
                            }
                            var questions = ex.GetArr("questions");
                            if (questions == null) {
                                questions = new List<JsValue>();
                                ex["questions"] = new JsValue { Type = "array", Arr = questions };
                            }
                            for (int qIdx = 0; qIdx < questions.Count; qIdx++) {
                                var qObj = questions[qIdx];
                                string qText = qObj.GetStr("questionText", qObj.GetStr("q", ""));
                                string aText = qObj.GetStr("solutions", qObj.GetStr("a", ""));
                                string hText = qObj.GetStr("hints", qObj.GetStr("hint", ""));
                                qObj["q"] = new JsValue { Type = "string", Str = qText };
                                qObj["a"] = new JsValue { Type = "string", Str = aText };
                                qObj["hint"] = new JsValue { Type = "string", Str = hText };
                                qObj["globalIndex"] = new JsValue { Type = "number", Num = flatSolutions.Count, Str = flatSolutions.Count.ToString() };
                                flatSolutions.Add(qObj);
                            }
                        }
                        chap["solutions"] = new JsValue { Type = "array", Arr = flatSolutions };
                    }
                }
            }
        }
    }

    private string FixAssetPaths(string str) {
        if (string.IsNullOrEmpty(str)) return "";
        string s = str.Trim();
        s = Regex.Replace(s, @"src=([""'])(?:\./)?images/", "src=$1/images/", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"^(?:\./)?images/", "/images/", RegexOptions.IgnoreCase);
        return s;
    }

    private string StripHtmlForSeo(string htmlStr) {
        if (string.IsNullOrEmpty(htmlStr)) return "";
        string s = Regex.Replace(htmlStr, @"<[^>]+>", " ");
        s = Regex.Replace(s, @"\$\$[\s\S]*?\$\$", "");
        s = Regex.Replace(s, @"\$[^$]+\$", "");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s;
    }

    private string EscapeAttr(string s) {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Replace("&", "&amp;").Replace("\"", "&quot;").Replace("<", "&lt;").Replace(">", "&gt;");
    }

    private int GetChapterUrlNumber(JsValue chapter, int fallbackIndex) {
        if (chapter != null) {
            string name = chapter.GetStr("name", "");
            var m = Regex.Match(name, @"(?:Chapter|\u092A\u093E\u0920)\s*(\d+)", RegexOptions.IgnoreCase);
            if (m.Success) {
                int parsed;
                if (int.TryParse(m.Groups[1].Value, out parsed)) return parsed;
            }
        }
        return fallbackIndex + 1;
    }

    private bool IsChapterWithoutExercises(JsValue chapter, int index, string subjectKey, int? branchIndex = null) {
        if (chapter != null && (chapter.GetBool("hasNoExercises") || chapter.GetBool("noExercises"))) return true;
        if (subjectKey == "science" && index == 0) return true;
        if (subjectKey == "sst" && (branchIndex == null || branchIndex == 0) && index == 0) return true;
        return false;
    }

    private string GetBranchIcon(JsValue branch, int index) {
        if (branch != null && !string.IsNullOrEmpty(branch.GetStr("icon"))) return branch.GetStr("icon");
        string name = (branch != null ? branch.GetStr("name", "") : "").ToLowerInvariant();
        if (name.Contains("geography")) return "\U0001F5FA\uFE0F";
        if (name.Contains("history")) return "\U0001F3DB\uFE0F";
        if (name.Contains("political") || name.Contains("civics")) return "\u2696\uFE0F";
        if (name.Contains("economics")) return "\U0001F4C8";
        if (name.Contains("\u0917\u0926\u094D\u092F") || name.Contains("gadya")) return "\U0001F4D6";
        if (name.Contains("\u092A\u0926\u094D\u092F") || name.Contains("padya")) return "\U0001FAB6";
        if (name.Contains("prose")) return "\U0001F4D6";
        if (name.Contains("poetry") || name.Contains("poem")) return "\U0001FAB6";
        if (name.Contains("part 1")) return "\U0001F4D0";
        if (name.Contains("part 2") || name.Contains("manjari")) return "\U0001F9EE";
        return "\U0001F4C1";
    }

    private string GetChapterIcon(JsValue chapter, int index, string subjectKey) {
        if (chapter != null && !string.IsNullOrEmpty(chapter.GetStr("icon"))) return chapter.GetStr("icon");
        string name = (chapter != null ? chapter.GetStr("name", "") : "").ToLowerInvariant();

        if (name.Contains("exploration") || name.Contains("secondary science")) return "\U0001F52D";
        if (name.Contains("cell")) return "\U0001F52C";
        if (name.Contains("tissue")) return "\U0001F33F";
        if (name.Contains("motion around") || name.Contains("describing motion")) return "\U0001F3CE\uFE0F";
        if (name.Contains("mixture") || name.Contains("separation")) return "\U0001F9EA";
        if (name.Contains("forces affect") || name.Contains("force")) return "\U0001F9F2";
        if (name.Contains("work") || name.Contains("energy") || name.Contains("machine")) return "\u26A1";
        if (name.Contains("inside the atom")) return "\u269B\uFE0F";
        if (name.Contains("atomic foundation") || name.Contains("foundations of matter")) return "\U0001F9EA";
        if (name.Contains("sound")) return "\U0001F50A";
        if (name.Contains("reproduction")) return "\U0001F331";
        if (name.Contains("diversity") || name.Contains("classification") || name.Contains("patterns in life")) return "\U0001F98B";
        if (name.Contains("earth as a system")) return "\U0001F30D";

        if (name.Contains("understanding social science")) return "\U0001F9ED";
        if (name.Contains("oceans and life") || name.Contains("ocean")) return "\U0001F30A";
        if (name.Contains("life on earth") || name.Contains("biome")) return "\U0001F33F";
        if (name.Contains("shaping of the earth")) return "\U0001F30B";
        if (name.Contains("atmosphere") || name.Contains("climate")) return "\u26C5";
        if (name.Contains("early human") || name.Contains("civilisation") || name.Contains("civilization")) return "\U0001F3FA";
        if (name.Contains("state and society")) return "\U0001F451";
        if (name.Contains("democracy")) return "\U0001F3DB\uFE0F";
        if (name.Contains("election")) return "\U0001F5F3\uFE0F";
        if (name.Contains("building blocks of economics")) return "\U0001F9F1";
        if (name.Contains("price puzzle") || name.Contains("market")) return "\U0001F3F7\uFE0F";

        if (name.Contains("grandmother")) return "\U0001F475";
        if (name.Contains("pot maker")) return "\U0001F3FA";
        if (name.Contains("winds of change")) return "\U0001F343";
        if (name.Contains("vitamin-m")) return "\U0001F48A";
        if (name.Contains("limitless possibilit")) return "\U0001F680";
        if (name.Contains("twin melodies")) return "\U0001F3B6";
        if (name.Contains("carrier of words")) return "\u2709\uFE0F";
        if (name.Contains("follow that dream")) return "\u2728";
        if (name.Contains("bharat our land")) return "\U0001F3DE\uFE0F";
        if (name.Contains("gifts of grace")) return "\U0001F338";
        if (name.Contains("canvas of soil")) return "\U0001F33E";
        if (name.Contains("remember my mother")) return "\U0001F54A\uFE0F";
        if (name.Contains("nine gold medals")) return "\U0001F3C5";
        if (name.Contains("friend found in music")) return "\U0001F3BB";
        if (name.Contains("words")) return "\U0001F4AC";
        if (name.Contains("believe in yourself")) return "\U0001F985";

        if (name.Contains("algebra") || name.Contains("identit")) return "\U0001F522";
        if (name.Contains("proposition") || name.Contains("converse")) return "\U0001F9E0";
        if (name.Contains("quantities combine") || name.Contains("understanding data")) return "\U0001F4CA";
        if (name.Contains("algorithm")) return "\u2699\uFE0F";
        if (name.Contains("quadrilateral")) return "\U0001F537";
        if (name.Contains("two variables") || name.Contains("one line")) return "\U0001F4C8";
        if (name.Contains("sequence") || name.Contains("progression")) return "\U0001F522";
        if (name.Contains("up and down") || name.Contains("round and round") || name.Contains("up and round")) return "\u2B55";
        if (name.Contains("number")) return "\U0001F522";
        if (name.Contains("polynomial")) return "\U0001F4D0";
        if (name.Contains("coordinate")) return "\U0001F4C8";
        if (name.Contains("linear equation")) return "\u2696\uFE0F";
        if (name.Contains("lines and angle")) return "\U0001F4CF";
        if (name.Contains("triangle")) return "\U0001F53A";
        if (name.Contains("stat") || name.Contains("data")) return "\U0001F4CA";
        if (name.Contains("probab")) return "\U0001F3B2";
        if (name.Contains("measuring space") || name.Contains("perimeter")) return "\U0001F4D0";
        if (name.Contains("surface") || name.Contains("volume") || name.Contains("area")) return "\U0001F4E6";

        if (subjectKey == "hindi") {
            if (name.Contains("\u091D\u093E\u0901\u0938\u0940") || name.Contains("jhansi")) return "\u2694\uFE0F";
            if (name.Contains("\u0918\u0930 \u0915\u0940 \u092F\u093E\u0926") || name.Contains("ghar ki yaad")) return "\U0001F3E0";
            if (name.Contains("\u0926\u094B \u092C\u0948\u0932\u094B\u0902") || name.Contains("bailon")) return "\U0001F402";
            if (name.Contains("lhasa")) return "\U0001F3D4\uFE0F";
            if (name.Contains("sawle")) return "\U0001F9A6";
            return "\U0001FAB6";
        }

        string[] mathIcons = new string[] { "\U0001F522", "\U0001F4D0", "\U0001F4C8", "\u2696\uFE0F", "\u2B55", "\U0001F4CF", "\U0001F53A", "\U0001F537" };
        if (subjectKey == "maths") return mathIcons[index % mathIcons.Length];
        if (subjectKey == "science") return "\U0001F52C";
        if (subjectKey == "sst") return "\U0001F30D";
        if (subjectKey == "english") return "\U0001F4D6";
        if (subjectKey == "hindi") return "\U0001FAB6";

        return "\U0001F4D8";
    }

    private string EscapeJson(string str) {
        if (string.IsNullOrEmpty(str)) return "";
        StringBuilder sb = new StringBuilder(str.Length + 16);
        foreach (char c in str) {
            switch (c) {
                case '\\': sb.Append("\\\\"); break;
                case '"': sb.Append("\\\""); break;
                case '\r': break;
                case '\n': sb.Append(" "); break;
                case '\t': sb.Append(" "); break;
                default:
                    if (c < 32) sb.Append(' ');
                    else sb.Append(c);
                    break;
            }
        }
        return sb.ToString().Trim();
    }

    private string BuildFaqJsonLd(List<JsValue> questions) {
        if (questions == null || questions.Count == 0) return "";
        int limit = Math.Min(questions.Count, 25);
        StringBuilder sb = new StringBuilder();
        sb.Append("\n    <script type=\"application/ld+json\">\n    {\n      \"@context\": \"https://schema.org\",\n      \"@type\": \"FAQPage\",\n      \"mainEntity\": [\n");
        int added = 0;
        for (int i = 0; i < limit; i++) {
            string qText = EscapeJson(StripHtmlForSeo(questions[i].GetStr("q", "")));
            string aText = EscapeJson(StripHtmlForSeo(questions[i].GetStr("a", "")));
            if (string.IsNullOrEmpty(qText) || string.IsNullOrEmpty(aText)) continue;
            if (qText.Length > 280) qText = qText.Substring(0, 280) + "...";
            if (aText.Length > 900) aText = aText.Substring(0, 900) + "...";
            if (added > 0) sb.Append(",\n");
            sb.Append("        {\n          \"@type\": \"Question\",\n          \"name\": \"" + qText + "\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"" + aText + "\"\n          }\n        }");
            added++;
        }
        sb.Append("\n      ]\n    }\n    </script>");
        return added > 0 ? sb.ToString() : "";
    }

    private string BuildPageHtml(
        string routePath,
        string seoTitle,
        string seoDesc,
        string activeTab,
        string activeLayer,
        string backHref = "/",
        string backText = "&larr; Back to Subjects",
        string headingHtml = "",
        string bodyInnerHtml = "",
        string extraHeadHtml = ""
    ) {
        string cleanRoute = (routePath ?? "").Trim('/');
        string canonicalUrl = string.IsNullOrEmpty(cleanRoute)
            ? "https://solvespot.in/"
            : "https://solvespot.in/" + cleanRoute;

        string html = masterTemplate;

        html = html.Replace(
            "<title>NCERT Solutions for Class 9 - SolveSpot</title>",
            "<title>" + EscapeAttr(seoTitle) + "</title>"
        );
        html = html.Replace(
            "<meta name=\"description\" content=\"Free, verified NCERT Class 9 textbook solutions for Science, Mathematics, Social Science, English, and Hindi. Clean step-by-step answers, formulas, hints, and exam notes.\">",
            "<meta name=\"description\" content=\"" + EscapeAttr(seoDesc) + "\">"
        );
        html = html.Replace(
            "<link rel=\"canonical\" href=\"https://solvespot.in/\">",
            "<link rel=\"canonical\" href=\"" + canonicalUrl + "\">"
        );
        html = html.Replace(
            "<meta property=\"og:url\" content=\"https://solvespot.in/\">",
            "<meta property=\"og:url\" content=\"" + canonicalUrl + "\">"
        );
        html = html.Replace(
            "<meta property=\"og:title\" content=\"NCERT Solutions for Class 9 - SolveSpot\">",
            "<meta property=\"og:title\" content=\"" + EscapeAttr(seoTitle) + "\">"
        );
        html = html.Replace(
            "<meta property=\"og:description\" content=\"Access 1,000+ verified, step-by-step textbook solutions across Science, Mathematics, Social Science, English, and Hindi with interactive hints and zero paywalls.\">",
            "<meta property=\"og:description\" content=\"" + EscapeAttr(seoDesc) + "\">"
        );
        html = html.Replace(
            "<meta name=\"twitter:title\" content=\"NCERT Solutions for Class 9 - SolveSpot\">",
            "<meta name=\"twitter:title\" content=\"" + EscapeAttr(seoTitle) + "\">"
        );
        html = html.Replace(
            "<meta name=\"twitter:description\" content=\"Access 1,000+ verified, step-by-step textbook solutions across Science, Mathematics, Social Science, English, and Hindi with zero paywalls.\">",
            "<meta name=\"twitter:description\" content=\"" + EscapeAttr(seoDesc) + "\">"
        );

        if (activeTab != "all") {
            html = html.Replace(
                "<a class=\"nav-tab active\" data-tab=\"all\"",
                "<a class=\"nav-tab\" data-tab=\"all\""
            );
            if (!string.IsNullOrEmpty(activeTab) && activeTab != "none") {
                html = html.Replace(
                    "<a class=\"nav-tab\" data-tab=\"" + activeTab + "\"",
                    "<a class=\"nav-tab active\" data-tab=\"" + activeTab + "\""
                );
            }
        }

        if (activeLayer != "subject-view") {
            html = html.Replace(
                "<section id=\"subject-view\" class=\"view-layer\">",
                "<section id=\"subject-view\" class=\"view-layer hidden\">"
            );

            if (activeLayer == "chapter-view") {
                html = html.Replace(
                    "<section id=\"chapter-view\" class=\"view-layer hidden\">",
                    "<section id=\"chapter-view\" class=\"view-layer\">"
                );
                html = html.Replace(
                    "<a id=\"chapter-back-link\" class=\"btn-back\" href=\"/\">&larr; Back to Subjects</a>",
                    "<a id=\"chapter-back-link\" class=\"btn-back\" href=\"" + backHref + "\">" + backText + "</a>"
                );
                html = html.Replace(
                    "<h1 id=\"chapter-title-heading\">Subject Chapters</h1>",
                    "<h1 id=\"chapter-title-heading\">" + headingHtml + "</h1>"
                );
                html = html.Replace(
                    "<!-- Dynamically generated chapter links go here -->",
                    bodyInnerHtml
                );
            } else if (activeLayer == "solution-view") {
                html = html.Replace(
                    "<section id=\"solution-view\" class=\"view-layer hidden\">",
                    "<section id=\"solution-view\" class=\"view-layer\">"
                );
                html = html.Replace(
                    "<a id=\"solution-back-link\" class=\"btn-back\" href=\"/\">&larr; Back to Chapters</a>",
                    "<a id=\"solution-back-link\" class=\"btn-back\" href=\"" + backHref + "\">" + backText + "</a>"
                );
                html = html.Replace(
                    "<h1 id=\"final-solution-heading\">Chapter Solutions</h1>",
                    "<h1 id=\"final-solution-heading\">" + headingHtml + "</h1>"
                );
                html = html.Replace(
                    "<!-- Final text solutions injected here -->",
                    bodyInnerHtml
                );
            } else {
                html = html.Replace(
                    "<div id=\"" + activeLayer + "\" class=\"view-layer hidden container\">",
                    "<div id=\"" + activeLayer + "\" class=\"view-layer container\">"
                );
                html = html.Replace(
                    "<div class=\"container\" id=\"homepage-view\">",
                    "<div class=\"container hidden\" id=\"homepage-view\">"
                );
            }
        }

        if (!string.IsNullOrEmpty(extraHeadHtml)) {
            html = html.Replace("</head>", extraHeadHtml + "\r\n</head>");
        }

        return html;
    }

    private void WriteRoutePage(string routePath, string html, bool includeInSitemap = true) {
        string cleanRoute = (routePath ?? "").Trim('/');
        string targetFile;
        if (string.IsNullOrEmpty(cleanRoute)) {
            targetFile = Path.Combine(rootDir, "index.html");
        } else {
            string dirPath = Path.Combine(rootDir, cleanRoute.Replace('/', Path.DirectorySeparatorChar));
            if (!Directory.Exists(dirPath)) {
                Directory.CreateDirectory(dirPath);
            }
            targetFile = Path.Combine(dirPath, "index.html");
        }
        File.WriteAllText(targetFile, html, utf8NoBom);
        TotalFilesWritten++;
        if (includeInSitemap && !GeneratedRoutes.Contains(cleanRoute)) {
            GeneratedRoutes.Add(cleanRoute);
        }
    }

    public void GenerateAll() {
        // 1. Homepage (index.html & 404.html)
        GeneratedRoutes.Add("");
        File.WriteAllText(Path.Combine(rootDir, "404.html"), masterTemplate, utf8NoBom);
        TotalFilesWritten++;

        // 2. Policy Pages
        WriteRoutePage("about", BuildPageHtml(
            "about",
            "About Us & Editorial Policy - SolveSpot",
            "Learn about SolveSpot, our editorial verification process, and how we build step-by-step NCERT Class 9 textbook solutions for CBSE students.",
            "none", "about-view"
        ));
        WriteRoutePage("privacy", BuildPageHtml(
            "privacy",
            "Privacy Policy - SolveSpot",
            "Read the Privacy Policy for SolveSpot (solvespot.in), detailing cookie usage, Google AdSense data policies, and student privacy protection.",
            "none", "privacy-view"
        ));
        WriteRoutePage("terms", BuildPageHtml(
            "terms",
            "Terms of Service - SolveSpot",
            "Review the Terms of Service, educational fair use guidelines, and intellectual property policies for using SolveSpot Class 9 textbook solutions.",
            "none", "terms-view"
        ));
        WriteRoutePage("contact", BuildPageHtml(
            "contact",
            "Contact Us - SolveSpot",
            "Get in touch with the SolveSpot academic team to report textbook errata, request solution clarifications, or send feedback.",
            "none", "contact-view"
        ));
        WriteRoutePage("games", BuildPageHtml(
            "games",
            "Arcade & Break Zone - 10 Free Mini-Games - SolveSpot",
            "Take a quick study break with 10 free arcade games: Neon Snake, 2048, Flappy Bird, Brick Breaker, Tower Stacker, Space Shooter, Cyber Runner, Knife Hit, 3-Lane Runner, and Minesweeper.",
            "games", "games-view"
        ));
        WriteRoutePage("formulas", BuildPageHtml(
            "formulas",
            "NCERT Solutions for Class 9 Maths & Science Formulas Cheat Sheet - SolveSpot",
            "Complete NCERT Class 9 Mathematics (Ganita Prakash) and Science (Physics & Chemistry) formula sheet: algebraic identities, mensuration tables, motion equations, gravitation, work-energy, and sound formulas.",
            "formulas", "formulas-view"
        ));
        WriteRoutePage("gk", BuildPageHtml(
            "gk",
            "Test Your GK - 50 Class 6th to 9th GK Questions & Answers - SolveSpot",
            "Test your general knowledge with 50 fun, interactive GK questions and verified answers for Class 6th to 9th students. Science, History, Geography, Civics, and Inventions.",
            "gk", "gk-view"
        ));
        WriteRoutePage("periodic-table", BuildPageHtml(
            "periodic-table",
            "Interactive Class 9 Periodic Table - Bohr-Bury Shells, Valency & Formulas - SolveSpot",
            "Explore the interactive Class 9 Science Periodic Table! Tap any element to see Atomic Number (Z), Mass Number (A), animated Bohr-Bury Electron Shell Diagram (K, L, M, N), Valency, and Chemical Formulas.",
            "periodic-table", "periodic-view"
        ));
        WriteRoutePage("calculator", BuildPageHtml(
            "calculator",
            "CBSE Class 9 Marks, Percentage & Grade (A1 to E) Calculator - SolveSpot",
            "Instant CBSE Class 9 Marks & Percentage Calculator! Enter your marks in Science, Maths, Social Science, English, and Hindi to calculate Percentage, CBSE Grades (A1 to E), CGPA, and Remarks.",
            "calculator", "calculator-view"
        ));

        // 3. Subjects, Parts, Branches, Chapters, and Exercises
        string[] subjectOrder = new string[] { "science", "maths", "sst", "english", "hindi" };
        foreach (string subKey in subjectOrder) {
            var subData = db[subKey];
            if (subData == null) continue;
            GenerateSubjectPage(subKey, subData);

            if (subKey == "sst") {
                GenerateSstPartPage(1, subData);
                GenerateSstPartPage(2, subData);
            }

            if (subData.GetBool("isBranching")) {
                var branches = subData.GetArr("branches");
                var seenDirectChapNums = new HashSet<int>();
                for (int bIdx = 0; bIdx < branches.Count; bIdx++) {
                    GenerateBranchPage(subKey, subData, bIdx);
                    var branchData = branches[bIdx];
                    var chapters = branchData.GetArr("chapters");
                    if (chapters == null) continue;
                    for (int cIdx = 0; cIdx < chapters.Count; cIdx++) {
                        var chapData = chapters[cIdx];
                        if (IsChapterWithoutExercises(chapData, cIdx, subKey, bIdx)) continue;
                        int chapNum = GetChapterUrlNumber(chapData, cIdx);
                        bool isFirstDirectChap = !seenDirectChapNums.Contains(chapNum);
                        if (isFirstDirectChap) seenDirectChapNums.Add(chapNum);

                        var exercises = chapData.GetArr("exercises");
                        if (exercises != null && exercises.Count > 0) {
                            GenerateBranchExerciseListPage(subKey, subData, bIdx, cIdx, isFirstDirectChap);
                            for (int exIdx = 0; exIdx < exercises.Count; exIdx++) {
                                string exId = exercises[exIdx].GetStr("id", (exIdx + 1).ToString());
                                GenerateBranchChapterPage(subKey, subData, bIdx, cIdx, exId, isFirstDirectChap);
                            }
                            GenerateBranchChapterPage(subKey, subData, bIdx, cIdx, "all", isFirstDirectChap);
                        } else {
                            GenerateBranchChapterPage(subKey, subData, bIdx, cIdx, "all", isFirstDirectChap);
                        }
                    }
                }
            } else {
                var chapters = subData.GetArr("chapters");
                if (chapters != null) {
                    for (int cIdx = 0; cIdx < chapters.Count; cIdx++) {
                        var chapData = chapters[cIdx];
                        if (IsChapterWithoutExercises(chapData, cIdx, subKey, null)) continue;
                        GenerateStandardChapterPage(subKey, subData, cIdx);
                    }
                }
            }
        }
    }

    private void GenerateSubjectPage(string subKey, JsValue data) {
        StringBuilder grid = new StringBuilder();
        if (subKey == "sst") {
            grid.Append(@"
                <a class=""chapter-select-btn branch-select-btn"" style=""border-left: 5px solid #f59e0b; padding: 1.25rem 1.15rem;"" href=""/subject/sst/part/1/"">
                    <div class=""chap-btn-content"">
                        <span class=""chap-icon-badge branch-icon-badge"" style=""font-size: 1.6rem;"">" + "\U0001F4DA" + @"</span>
                        <div class=""branch-text-wrapper"">
                            <span class=""chap-btn-title"" style=""font-size: 1.12rem; font-weight: 700;"">Social Science (Part 1)</span>
                            <span class=""branch-chap-count"" style=""margin-top: 4px; color: #475569; font-size: 0.86rem; line-height: 1.45;"">Geography (Earth's Surface & Climate), History (Early Civilisations), Political Science & Economics.</span>
                            <span style=""display: inline-block; margin-top: 6px; font-size: 0.76rem; font-weight: 700; color: #f59e0b; background: #fef3c7; padding: 2px 8px; border-radius: 9999px;"">4 Branches &bull; 8 Solved Chapters</span>
                        </div>
                    </div>
                </a>
                <a class=""chapter-select-btn branch-select-btn"" style=""border-left: 5px solid #0284c7; padding: 1.25rem 1.15rem;"" href=""/subject/sst/part/2/"">
                    <div class=""chap-btn-content"">
                        <span class=""chap-icon-badge branch-icon-badge"" style=""font-size: 1.6rem;"">" + "\U0001F30A" + @"</span>
                        <div class=""branch-text-wrapper"">
                            <span class=""chap-btn-title"" style=""font-size: 1.12rem; font-weight: 700;"">Social Science (Part 2)</span>
                            <span class=""branch-chap-count"" style=""margin-top: 4px; color: #475569; font-size: 0.86rem; line-height: 1.45;"">Geography (Oceans and Life, Marine Resources, Blue Economy), History, Political Science & Economics.</span>
                            <span style=""display: inline-block; margin-top: 6px; font-size: 0.76rem; font-weight: 700; color: #0284c7; background: #fef3c7; padding: 2px 8px; border-radius: 9999px;"">4 Branches &bull; New Syllabus</span>
                        </div>
                    </div>
                </a>");

            string sstHtml = BuildPageHtml(
                "subject/sst",
                "Social Science (Parts 1 & 2) - Class 9 SolveSpot Hub",
                "NCERT Class 9 Social Science textbook solutions for both Part 1 and Part 2: Geography, History, Political Science, and Economics.",
                "sst", "chapter-view", "/", "\u2190 Back to Subjects", data.GetStr("title"), grid.ToString()
            );
            WriteRoutePage("subject/sst", sstHtml);
            return;
        }

        if (data.GetBool("isBranching")) {
            var branches = data.GetArr("branches");
            for (int index = 0; index < branches.Count; index++) {
                var branch = branches[index];
                string branchName = branch.GetStr("name");
                string branchIcon = GetBranchIcon(branch, index);
                int count = branch.GetArr("chapters") != null ? branch.GetArr("chapters").Count : 0;
                string countText = count > 0 ? (count + " Chapter" + (count != 1 ? "s" : "")) : "Under Development";
                string branchDesc = countText + " in this section.";
                string badgeText = countText;
                string borderColor = index == 0 ? "#7c3aed" : "#0284c7";
                string badgeColor = borderColor;
                string badgeBg = "#fef3c7";

                if (subKey == "maths" && index == 0) {
                    branchName = "Ganita Prakash (Part 1)";
                    branchIcon = "\U0001F4D0";
                    branchDesc = "Coordinates, Linear Polynomials, Number Systems, Algebraic Identities, Perimeter & Area, Probability & Sequences.";
                    badgeText = "Part 1 &bull; 8 Solved Chapters";
                    borderColor = "#7c3aed"; badgeColor = "#7c3aed"; badgeBg = "#ede9fe";
                } else if (subKey == "maths" && index == 1) {
                    branchName = "Ganita Prakash (Part 2)";
                    branchIcon = "\U0001F4CA";
                    branchDesc = "Propositions, Understanding Data, Algorithms, Quadrilaterals, Linear Equations & Surface Areas and Volumes.";
                    badgeText = "Part 2 &bull; 6 Solved Chapters";
                    borderColor = "#0284c7"; badgeColor = "#0284c7"; badgeBg = "#e0f2fe";
                } else if (subKey == "english" && index == 0) {
                    branchName = "Prose (Chapters)";
                    branchIcon = "\U0001F4D6";
                    branchDesc = "Grandmother to Read, The Pot Maker, Winds of Change, Vitamin-M, Limitless Possibilities, Twin Melodies & Follow That Dream.";
                    badgeText = "Prose &bull; 8 Solved Chapters";
                    borderColor = "#0284c7"; badgeColor = "#0284c7"; badgeBg = "#e0f2fe";
                } else if (subKey == "english" && index == 1) {
                    branchName = "Poetry (Poems)";
                    branchIcon = "\U0001FAB6";
                    branchDesc = "Bharat Our Land, Gifts of Grace, Canvas of Soil, I Cannot Remember My Mother, Nine Gold Medals, Words & Believe in Yourself.";
                    badgeText = "Poetry &bull; 8 Solved Poems";
                    borderColor = "#f59e0b"; badgeColor = "#f59e0b"; badgeBg = "#fef3c7";
                } else if (subKey == "hindi" && index == 0) {
                    branchName = "\u0917\u0926\u094D\u092F \u0916\u0902\u0921 (Gadya Khand)";
                    branchIcon = "\U0001F4DA";
                    branchDesc = "\u0926\u094B \u092C\u0948\u0932\u094B\u0902 \u0915\u0940 \u0915\u0925\u093E, \u0915\u094D\u092F\u093E \u0932\u093F\u0916\u0942\u0901?, \u0938\u0902\u0935\u093E\u0926\u0939\u0940\u0928, \u0910\u0938\u0940 \u092D\u0940 \u092C\u093E\u0924\u0947\u0902 \u0939\u094B\u0924\u0940 \u0939\u0948\u0902, \u0906\u0916\u093F\u0930\u0940 \u091A\u091F\u094D\u091F\u093E\u0928 \u0924\u0915, \u0930\u0940\u0922\u093C \u0915\u0940 \u0939\u0921\u094D\u0921\u0940 \u0935 \u092E\u0948\u0902 \u0914\u0930 \u092E\u0947\u0930\u093E \u0926\u0947\u0936\u0964";
                    badgeText = "\u0917\u0926\u094D\u092F \u0916\u0902\u0921 &bull; 7 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u092A\u093E\u0920";
                    borderColor = "#e11d48"; badgeColor = "#e11d48"; badgeBg = "#ffe4e6";
                } else if (subKey == "hindi" && index == 1) {
                    branchName = "\u092A\u0926\u094D\u092F \u0916\u0902\u0921 (Padya Khand)";
                    branchIcon = "\U0001FAB6";
                    branchDesc = "\u0930\u0948\u0926\u093E\u0938 (\u092A\u0926), \u0930\u093E\u092E-\u0932\u0915\u094D\u0937\u094D\u092E\u0923-\u092A\u0930\u0936\u0941\u0930\u093E\u092E \u0938\u0902\u0935\u093E\u0926, \u092D\u093E\u0930\u0924\u093F \u091C\u092F \u0935\u093F\u091C\u092F\u0915\u0930\u0947, \u091D\u093E\u0901\u0938\u0940 \u0915\u0940 \u0930\u093E\u0928\u0940 \u0935 \u0918\u0930 \u0915\u0940 \u092F\u093E\u0926\u0964";
                    badgeText = "\u092A\u0926\u094D\u092F \u0916\u0902\u0921 &bull; 5 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u092A\u093E\u0920";
                    borderColor = "#f59e0b"; badgeColor = "#f59e0b"; badgeBg = "#fef3c7";
                }

                grid.AppendFormat(@"
                <a class=""chapter-select-btn branch-select-btn"" style=""border-left: 5px solid {0}; padding: 1.25rem 1.15rem;"" href=""/subject/{1}/branch/{2}/"">
                    <div class=""chap-btn-content"">
                        <span class=""chap-icon-badge branch-icon-badge"" style=""font-size: 1.6rem;"">{3}</span>
                        <div class=""branch-text-wrapper"">
                            <span class=""chap-btn-title"" style=""font-size: 1.12rem; font-weight: 700;"">{4}</span>
                            <span class=""branch-chap-count"" style=""margin-top: 4px; color: #475569; font-size: 0.86rem; line-height: 1.45;"">{5}</span>
                            <span class=""branch-badge-pill"" style=""display: inline-block; margin-top: 6px; font-size: 0.76rem; font-weight: 700; color: {6}; background: {7}; padding: 2px 8px; border-radius: 9999px;"">{8}</span>
                        </div>
                    </div>
                </a>", borderColor, subKey, index + 1, branchIcon, branchName, branchDesc, badgeColor, badgeBg, badgeText);
            }
        } else {
            var chapters = data.GetArr("chapters");
            for (int index = 0; index < chapters.Count; index++) {
                var chapter = chapters[index];
                int chapNum = GetChapterUrlNumber(chapter, index);
                string cleanTitle = Regex.Replace(chapter.GetStr("name", ""), @"[\r\n]+", " ").Trim();
                string chapIcon = GetChapterIcon(chapter, index, subKey);
                bool noEx = IsChapterWithoutExercises(chapter, index, subKey, null);
                if (noEx) {
                    grid.AppendFormat(@"
                    <div class=""chapter-select-btn chapter-no-exercises"" onclick=""showToast('No exercises in this chapter - it is an introductory reading module.', 'info')"" title=""No exercises in this chapter"" tabindex=""0"">
                        <div class=""chap-btn-content"">
                            <span class=""chap-icon-badge"">{0}</span>
                            <div class=""branch-text-wrapper"">
                                <span class=""chap-btn-title"">{1}</span>
                                <span class=""branch-chap-count"">Introductory Reading &bull; No textbook questions</span>
                            </div>
                        </div>
                        <div class=""no-ex-hover-badge"">
                            <span class=""no-ex-icon"">i </span>
                            <span class=""no-ex-label"">No exercises in this chapter</span>
                        </div>
                    </div>", chapIcon, cleanTitle);
                } else {
                    grid.AppendFormat(@"
                    <a class=""chapter-select-btn"" href=""/subject/{0}/chapter/{1}/"">
                        <div class=""chap-btn-content"">
                            <span class=""chap-icon-badge"">{2}</span>
                            <span class=""chap-btn-title"">{3}</span>
                        </div>
                    </a>", subKey, chapNum, chapIcon, cleanTitle);
                }
            }
        }

        string subTitle = data.GetStr("title");
        string subCleanName = Regex.Replace(Regex.Replace(subTitle, @" Sections?", "", RegexOptions.IgnoreCase), @" Chapters?", "", RegexOptions.IgnoreCase);
        string pageHtml = BuildPageHtml(
            "subject/" + subKey,
            string.Format("NCERT Solutions for Class 9 {0} - SolveSpot", subCleanName),
            "Complete NCERT Class 9 " + subCleanName + " textbook solutions. Browse all chapters, exercise sets, formulas, and verified step-by-step exam answers.",
            subKey, "chapter-view", "/", "\u2190 Back to Subjects", subTitle, grid.ToString()
        );
        WriteRoutePage("subject/" + subKey, pageHtml);
    }

    private void GenerateSstPartPage(int partNum, JsValue data) {
        bool isPart1 = (partNum == 1);
        string bookTitle = isPart1 ? "Social Science (Part 1)" : "Social Science (Part 2)";
        string bookIcon = isPart1 ? "\U0001F4DA" : "\U0001F30A";
        string headingHtml = "<span class=\"heading-icon-badge\">" + bookIcon + "</span> " + bookTitle + " Subjects";

        int startIdx = isPart1 ? 0 : 4;
        int endIdx = isPart1 ? 3 : 7;
        var branches = data.GetArr("branches");
        StringBuilder grid = new StringBuilder();

        for (int index = startIdx; index <= endIdx && index < branches.Count; index++) {
            var branch = branches[index];
            string branchIcon = GetBranchIcon(branch, index);
            int count = branch.GetArr("chapters") != null ? branch.GetArr("chapters").Count : 0;
            string countText = count > 0 ? (count + " Chapter" + (count != 1 ? "s" : "")) : "Under Development";
            string cleanDisplayName = Regex.Replace(branch.GetStr("name", ""), @"^Part\s*[12]\s*-\s*", "", RegexOptions.IgnoreCase);
            grid.AppendFormat(@"
            <a class=""chapter-select-btn branch-select-btn"" style=""border-left: 5px solid #2563eb;"" href=""/subject/sst/branch/{0}/"">
                <div class=""chap-btn-content"">
                    <span class=""chap-icon-badge branch-icon-badge"">{1}</span>
                    <div class=""branch-text-wrapper"">
                        <span class=""chap-btn-title"">{2}</span>
                        <span class=""branch-chap-count"">{3}</span>
                    </div>
                </div>
            </a>", index + 1, branchIcon, cleanDisplayName, countText);
        }

        string route = "subject/sst/part/" + partNum;
        string html = BuildPageHtml(
            route,
            string.Format("NCERT Solutions for Class 9 {0} - SolveSpot", bookTitle),
            "NCERT Class 9 " + bookTitle + " solutions across Geography, History, Political Science, and Economics with chapter solutions.",
            "sst", "chapter-view", "/subject/sst/", "\u2190 Back to SST Books", headingHtml, grid.ToString()
        );
        WriteRoutePage(route, html);
    }

    private void GenerateBranchPage(string subKey, JsValue data, int branchIndex) {
        var branchData = data.GetArr("branches")[branchIndex];
        string branchName = branchData.GetStr("name");
        string branchIcon = GetBranchIcon(branchData, branchIndex);
        string headingHtml = "<span class=\"heading-icon-badge\">" + branchIcon + "</span> " + branchName + " Chapters";

        string backHref;
        string backText;
        if (subKey == "sst") {
            int partNum = branchIndex >= 4 ? 2 : 1;
            backHref = "/subject/sst/part/" + partNum + "/";
            backText = "\u2190 Back to SST Part " + partNum + " Subjects";
        } else {
            backHref = "/subject/" + subKey + "/";
            string cleanSub = Regex.Replace(Regex.Replace(data.GetStr("title"), @" Sections?", "", RegexOptions.IgnoreCase), @" Chapters?", "", RegexOptions.IgnoreCase);
            backText = "\u2190 Back to " + cleanSub;
        }

        StringBuilder grid = new StringBuilder();
        var chapters = branchData.GetArr("chapters");
        int chapTotal = chapters != null ? chapters.Count : 0;

        for (int index = 0; index < chapTotal; index++) {
            var chapter = chapters[index];
            int chapNum = GetChapterUrlNumber(chapter, index);
            string cleanTitle = Regex.Replace(chapter.GetStr("name", ""), @"[\r\n]+", " ").Trim();
            string chapIcon = GetChapterIcon(chapter, index, subKey);
            bool noEx = IsChapterWithoutExercises(chapter, index, subKey, branchIndex);

            if (noEx) {
                grid.AppendFormat(@"
                    <div class=""chapter-select-btn chapter-no-exercises"" onclick=""showToast('No exercises in this chapter - it is an introductory reading module.', 'info')"" title=""No exercises in this chapter"" tabindex=""0"">
                        <div class=""chap-btn-content"">
                            <span class=""chap-icon-badge"">{0}</span>
                            <div class=""branch-text-wrapper"">
                                <span class=""chap-btn-title"">{1}</span>
                                <span class=""branch-chap-count"">Introductory Reading &bull; No textbook questions</span>
                            </div>
                        </div>
                        <div class=""no-ex-hover-badge"">
                            <span class=""no-ex-icon"">i </span>
                            <span class=""no-ex-label"">No exercises in this chapter</span>
                        </div>
                    </div>", chapIcon, cleanTitle);
            } else {
                int exCount = chapter.GetArr("exercises") != null ? chapter.GetArr("exercises").Count : 0;
                int qCount = chapter.GetArr("solutions") != null ? chapter.GetArr("solutions").Count : 0;
                string subtitleHtml = exCount > 0
                    ? string.Format("<span class=\"branch-chap-count\">{0} Exercise Set{1} &bull; {2} Solved Questions</span>", exCount, exCount != 1 ? "s" : "", qCount)
                    : "";
                grid.AppendFormat(@"
                    <a class=""chapter-select-btn"" href=""/subject/{0}/branch/{1}/chapter/{2}/"">
                        <div class=""chap-btn-content"">
                            <span class=""chap-icon-badge"">{3}</span>
                            <div class=""branch-text-wrapper"">
                                <span class=""chap-btn-title"">{4}</span>
                                {5}
                            </div>
                        </div>
                    </a>", subKey, branchIndex + 1, chapNum, chapIcon, cleanTitle, subtitleHtml);
            }
        }

        string route = string.Format("subject/{0}/branch/{1}", subKey, branchIndex + 1);
        string subClean = Regex.Replace(data.GetStr("title"), @" Sections?", "", RegexOptions.IgnoreCase);
        string html = BuildPageHtml(
            route,
            string.Format("NCERT Solutions for Class 9 {0} ({1}) - SolveSpot", branchName, subClean),
            string.Format("NCERT Class 9 {0} ({1}) chapter-wise textbook solutions across {2} chapters with step-by-step answers and hints.", branchName, subClean, chapTotal),
            subKey, "chapter-view", backHref, backText, headingHtml, grid.ToString()
        );
        WriteRoutePage(route, html);
    }

    private void GenerateBranchExerciseListPage(string subKey, JsValue subjectData, int branchIndex, int chapterIndex, bool writeDirectChapterAlias) {
        var branchData = subjectData.GetArr("branches")[branchIndex];
        var chapterData = branchData.GetArr("chapters")[chapterIndex];
        var exercises = chapterData.GetArr("exercises");
        int chapNum = GetChapterUrlNumber(chapterData, chapterIndex);
        string cleanTitle = Regex.Replace(chapterData.GetStr("name", ""), @"[\r\n]+", " ").Trim();
        string chapIcon = GetChapterIcon(chapterData, chapterIndex, subKey);
        string headingHtml = "<span class=\"heading-icon-badge\">" + chapIcon + "</span> " + cleanTitle;
        string backHref = string.Format("/subject/{0}/branch/{1}/", subKey, branchIndex + 1);
        string backText = "\u2190 Back to " + branchData.GetStr("name");

        int totalQuestions = chapterData.GetArr("solutions") != null ? chapterData.GetArr("solutions").Count : 0;
        StringBuilder grid = new StringBuilder();

        for (int exIdx = 0; exIdx < exercises.Count; exIdx++) {
            var ex = exercises[exIdx];
            string exId = ex.GetStr("id", (exIdx + 1).ToString());
            int qCount = ex.GetArr("questions") != null ? ex.GetArr("questions").Count : 0;
            string exNameLow = ex.GetStr("name", "").ToLowerInvariant();
            string exIcon = "\U0001F4DD";
            if (exNameLow.Contains("understanding")) exIcon = "\U0001F50D";
            else if (exNameLow.Contains("reflection")) exIcon = "\U0001F4A1";
            else if (exNameLow.Contains("answer") || exNameLow.Contains("question")) exIcon = "\u270D\uFE0F";
            else if (exNameLow.Contains("end-of-chapter")) exIcon = "\U0001F3C6";
            else if (exNameLow.Contains("exercise")) exIcon = "\U0001F4D0";
            string displayTitle = ex.GetStr("title", ex.GetStr("name", "Exercise Set " + exId));

            grid.AppendFormat(@"
            <a class=""chapter-select-btn exercise-select-btn"" href=""/subject/{0}/branch/{1}/chapter/{2}/exercise/{3}/"">
                <div class=""chap-btn-content"">
                    <span class=""chap-icon-badge exercise-icon-badge"">{4}</span>
                    <div class=""branch-text-wrapper"">
                        <span class=""chap-btn-title"">{5}</span>
                        <span class=""branch-chap-count"">{6} Solved Question{7} &bull; Step-by-Step + Hints</span>
                    </div>
                </div>
            </a>", subKey, branchIndex + 1, chapNum, Uri.EscapeDataString(exId), exIcon, displayTitle, qCount, qCount != 1 ? "s" : "");
        }

        if (exercises.Count > 1) {
            grid.AppendFormat(@"
            <a class=""chapter-select-btn exercise-all-btn"" href=""/subject/{0}/branch/{1}/chapter/{2}/exercise/all/"">
                <div class=""chap-btn-content"">
                    <span class=""chap-icon-badge exercise-icon-badge"">" + "\U0001F4DA" + @"</span>
                    <div class=""branch-text-wrapper"">
                        <span class=""chap-btn-title"">View All Chapter Exercises Together</span>
                        <span class=""branch-chap-count"">All {3} Exercise Sets &bull; {4} Solved Questions</span>
                    </div>
                </div>
            </a>", subKey, branchIndex + 1, chapNum, exercises.Count, totalQuestions);
        }

        string route = string.Format("subject/{0}/branch/{1}/chapter/{2}", subKey, branchIndex + 1, chapNum);
        string subDisplay = subKey.ToUpperInvariant() == "SST" ? "Social Science" : (char.ToUpperInvariant(subKey[0]) + subKey.Substring(1));
        string seoTitle = string.Format("NCERT Solutions for Class 9 {0} {1} - SolveSpot", subDisplay, cleanTitle);
        string seoDesc = string.Format("NCERT Class 9 {0} {1} textbook solutions: {2} exercise sets and {3} step-by-step solved questions with hints.", branchData.GetStr("name"), cleanTitle, exercises.Count, totalQuestions);

        string html = BuildPageHtml(route, seoTitle, seoDesc, subKey, "chapter-view", backHref, backText, headingHtml, grid.ToString());
        WriteRoutePage(route, html, true);

        if (writeDirectChapterAlias) {
            string aliasRoute = string.Format("subject/{0}/chapter/{1}", subKey, chapNum);
            WriteRoutePage(aliasRoute, html, false);
        }
    }

    private void GenerateBranchChapterPage(string subKey, JsValue subjectData, int branchIndex, int chapterIndex, string activeExerciseId, bool writeDirectChapterAlias) {
        var branchData = subjectData.GetArr("branches")[branchIndex];
        var chapterData = branchData.GetArr("chapters")[chapterIndex];
        int chapNum = GetChapterUrlNumber(chapterData, chapterIndex);
        string cleanTitle = Regex.Replace(chapterData.GetStr("name", ""), @"[\r\n]+", " ").Trim();
        string chapIcon = GetChapterIcon(chapterData, chapterIndex, subKey);
        var exercises = chapterData.GetArr("exercises");
        bool hasExercises = exercises != null && exercises.Count > 0;

        JsValue activeExObj = null;
        if (hasExercises && !string.IsNullOrEmpty(activeExerciseId) && activeExerciseId != "all") {
            for (int i = 0; i < exercises.Count; i++) {
                var ex = exercises[i];
                if (string.Equals(ex.GetStr("id"), activeExerciseId, StringComparison.OrdinalIgnoreCase) ||
                    (i + 1).ToString() == activeExerciseId) {
                    activeExObj = ex;
                    break;
                }
            }
        }

        string subHeading = activeExObj != null ? (" <span style=\"color: #cfa670; font-weight: 600;\">\u2022 " + activeExObj.GetStr("name") + "</span>") : "";
        string headingHtml = "<span class=\"heading-icon-badge\">" + chapIcon + "</span> " + cleanTitle + subHeading;

        string backHref;
        string backText;
        if (hasExercises) {
            backHref = string.Format("/subject/{0}/branch/{1}/chapter/{2}/", subKey, branchIndex + 1, chapNum);
            backText = "\u2190 Back to " + cleanTitle.Split(':')[0] + " Exercises";
        } else {
            backHref = string.Format("/subject/{0}/branch/{1}/", subKey, branchIndex + 1);
            backText = "\u2190 Back to " + branchData.GetStr("name");
        }

        StringBuilder stack = new StringBuilder();

        if (hasExercises) {
            stack.Append("<div class=\"exercise-switcher-bar\">");
            foreach (var ex in exercises) {
                bool isCurrent = activeExObj != null && ex.GetStr("id") == activeExObj.GetStr("id");
                int qCount = ex.GetArr("questions") != null ? ex.GetArr("questions").Count : 0;
                stack.AppendFormat(@"<a class=""exercise-pill {0}"" href=""/subject/{1}/branch/{2}/chapter/{3}/exercise/{4}/"">{5} <span class=""pill-count"">{6}</span></a>",
                    isCurrent ? "active" : "", subKey, branchIndex + 1, chapNum, Uri.EscapeDataString(ex.GetStr("id")), ex.GetStr("name"), qCount);
            }
            if (exercises.Count > 1) {
                bool isAllActive = activeExObj == null;
                int totalCount = chapterData.GetArr("solutions") != null ? chapterData.GetArr("solutions").Count : 0;
                stack.AppendFormat(@"<a class=""exercise-pill {0}"" href=""/subject/{1}/branch/{2}/chapter/{3}/exercise/all/"">All Exercises <span class=""pill-count"">{4}</span></a>",
                    isAllActive ? "active" : "", subKey, branchIndex + 1, chapNum, totalCount);
            }
            stack.Append("</div>");
        }

        var listToRender = activeExObj != null ? activeExObj.GetArr("questions") : chapterData.GetArr("solutions");
        if (listToRender == null) listToRender = new List<JsValue>();

        string seoRoute;
        if (activeExObj != null) {
            seoRoute = string.Format("subject/{0}/branch/{1}/chapter/{2}/exercise/{3}", subKey, branchIndex + 1, chapNum, Uri.EscapeDataString(activeExObj.GetStr("id")));
        } else if (hasExercises) {
            seoRoute = string.Format("subject/{0}/branch/{1}/chapter/{2}/exercise/all", subKey, branchIndex + 1, chapNum);
        } else {
            seoRoute = string.Format("subject/{0}/branch/{1}/chapter/{2}", subKey, branchIndex + 1, chapNum);
        }

        for (int idx = 0; idx < listToRender.Count; idx++) {
            var sol = listToRender[idx];
            int globalIdx = sol["globalIndex"] != null ? (int)sol["globalIndex"].Num : idx;
            string uniqueId = "ans-branch-" + globalIdx;
            string hintId = "hint-branch-" + globalIdx;
            string badgeLabel = !string.IsNullOrEmpty(sol.GetStr("qNum")) ? sol.GetStr("qNum") : ("Q" + (idx + 1));
            string safeBadge = badgeLabel.Replace("'", "\\'");
            string qLinkRoute = seoRoute + "/?q=" + (globalIdx + 1);
            string hintHtml = FixAssetPaths(sol.GetStr("hint", sol.GetStr("hints", "")));
            string qHtml = FixAssetPaths(sol.GetStr("q", ""));
            string aHtml = FixAssetPaths(sol.GetStr("a", ""));
            string imgPath = !string.IsNullOrEmpty(sol.GetStr("image")) ? FixAssetPaths(sol.GetStr("image")) : "";

            stack.AppendFormat(@"
            <div class=""solution-card"" id=""card-branch-{0}"">
                <div class=""card-question-header"">
                    <span class=""q-badge"">{1}</span>
                    <div class=""question-text"">{2}</div>
                </div>
                {3}
                {4}
                <div id=""{5}"" class=""answer-text"">{6}</div>
                <div class=""card-actions-bar"">
                    {7}
                    {8}
                    <button class=""btn-copy-solution"" onclick=""copyQuestionLink('{9}', this)"" title=""Copy direct link to this question""><span>&#128279;</span> Copy Link</button>
                    <button class=""btn-copy-solution"" onclick=""shareQuestionWhatsApp('{9}', '{10}')"" title=""Share this solution on WhatsApp""><span>&#128172;</span> WhatsApp</button>
                </div>
            </div>",
                globalIdx,
                badgeLabel,
                qHtml,
                !string.IsNullOrEmpty(imgPath) ? string.Format("<img src=\"{0}\" class=\"question-image\" alt=\"Diagram\">", imgPath) : "",
                !string.IsNullOrEmpty(hintHtml) ? string.Format("<div id=\"{0}\" class=\"hint-box hidden\">{1}</div>", hintId, hintHtml) : "",
                uniqueId,
                aHtml,
                !string.IsNullOrEmpty(hintHtml) ? string.Format("<button class=\"btn-toggle-hint\" onclick=\"toggleHint('{0}', this)\" title=\"Show or hide hint / critical formula\"><span>" + "\U0001F4A1" + "</span> Show Hint / Formula</button>", hintId) : "",
                hasExercises ? string.Format("<button class=\"btn-toggle-solution active\" onclick=\"toggleSolution('{0}', this)\" title=\"Show or hide step-by-step solution\"><span>" + "\U0001F441\uFE0F" + "</span> Hide Solution</button>", uniqueId) : "",
                qLinkRoute,
                safeBadge
            );
        }

        string firstQSnippet = "";
        if (listToRender.Count > 0) {
            firstQSnippet = StripHtmlForSeo(listToRender[0].GetStr("q", ""));
            if (firstQSnippet.Length > 95) firstQSnippet = firstQSnippet.Substring(0, 95);
        }

        string subDisplay = subKey.ToUpperInvariant() == "SST" ? "Social Science" : (char.ToUpperInvariant(subKey[0]) + subKey.Substring(1));
        string exPart = activeExObj != null ? " (" + activeExObj.GetStr("name") + ")" : "";
        string seoTitle = string.Format("NCERT Solutions for Class 9 {0} {1}{2} - SolveSpot", subDisplay, cleanTitle, exPart);
        string seoDesc = string.Format("NCERT Class 9 {0} {1}{2} step-by-step solutions ({3} Q&As). {4}",
            branchData.GetStr("name"),
            cleanTitle,
            activeExObj != null ? " (" + activeExObj.GetStr("name") + ")" : "",
            listToRender.Count,
            !string.IsNullOrEmpty(firstQSnippet) ? "Includes: " + firstQSnippet + "..." : ""
        ).Trim();

        string faqSchema = BuildFaqJsonLd(listToRender);
        string html = BuildPageHtml(seoRoute, seoTitle, seoDesc, subKey, "solution-view", backHref, backText, headingHtml, stack.ToString(), faqSchema);
        WriteRoutePage(seoRoute, html, true);

        if (writeDirectChapterAlias) {
            if (!hasExercises && activeExerciseId == "all") {
                string aliasRoute = string.Format("subject/{0}/chapter/{1}", subKey, chapNum);
                WriteRoutePage(aliasRoute, html, false);
            } else if (hasExercises) {
                string exSeg = activeExObj != null ? Uri.EscapeDataString(activeExObj.GetStr("id")) : "all";
                string aliasExRoute = string.Format("subject/{0}/chapter/{1}/exercise/{2}", subKey, chapNum, exSeg);
                WriteRoutePage(aliasExRoute, html, false);
            }
        }
    }

    private void GenerateStandardChapterPage(string subKey, JsValue subjectData, int chapterIndex) {
        var chapterData = subjectData.GetArr("chapters")[chapterIndex];
        int chapNum = GetChapterUrlNumber(chapterData, chapterIndex);
        string cleanTitle = Regex.Replace(chapterData.GetStr("name", ""), @"[\r\n]+", " ").Trim();
        string chapIcon = GetChapterIcon(chapterData, chapterIndex, subKey);
        string headingHtml = "<span class=\"heading-icon-badge\">" + chapIcon + "</span> " + cleanTitle;
        string backHref = "/subject/" + subKey + "/";
        string backText = "\u2190 Back to Chapters";

        StringBuilder stack = new StringBuilder();
        var solutions = chapterData.GetArr("solutions");
        if (solutions == null) solutions = new List<JsValue>();

        string route = string.Format("subject/{0}/chapter/{1}", subKey, chapNum);

        for (int idx = 0; idx < solutions.Count; idx++) {
            var sol = solutions[idx];
            string uniqueId = "ans-std-" + idx;
            string hintId = "hint-std-" + idx;
            string badgeLabel = !string.IsNullOrEmpty(sol.GetStr("qNum")) ? sol.GetStr("qNum") : ("Q" + (idx + 1));
            string safeBadge = badgeLabel.Replace("'", "\\'");
            string qLinkRoute = route + "/?q=" + (idx + 1);
            string hintHtml = FixAssetPaths(sol.GetStr("hint", sol.GetStr("hints", "")));
            string qHtml = FixAssetPaths(sol.GetStr("q", ""));
            string aHtml = FixAssetPaths(sol.GetStr("a", ""));
            string imgPath = !string.IsNullOrEmpty(sol.GetStr("image")) ? FixAssetPaths(sol.GetStr("image")) : "";

            stack.AppendFormat(@"
            <div class=""solution-card"" id=""card-std-{0}"">
                <div class=""card-question-header"">
                    <span class=""q-badge"">{1}</span>
                    <div class=""question-text"">{2}</div>
                </div>
                {3}
                {4}
                <div id=""{5}"" class=""answer-text"">{6}</div>
                <div class=""card-actions-bar"">
                    {7}
                    <button class=""btn-copy-solution"" onclick=""copyQuestionLink('{8}', this)"" title=""Copy direct link to this question""><span>&#128279;</span> Copy Link</button>
                    <button class=""btn-copy-solution"" onclick=""shareQuestionWhatsApp('{8}', '{9}')"" title=""Share this solution on WhatsApp""><span>&#128172;</span> WhatsApp</button>
                </div>
            </div>",
                idx,
                badgeLabel,
                qHtml,
                !string.IsNullOrEmpty(imgPath) ? string.Format("<img src=\"{0}\" class=\"question-image\" alt=\"Question diagram\">", imgPath) : "",
                !string.IsNullOrEmpty(hintHtml) ? string.Format("<div id=\"{0}\" class=\"hint-box hidden\">{1}</div>", hintId, hintHtml) : "",
                uniqueId,
                aHtml,
                !string.IsNullOrEmpty(hintHtml) ? string.Format("<button class=\"btn-toggle-hint\" onclick=\"toggleHint('{0}', this)\" title=\"Show or hide hint / critical formula\"><span>" + "\U0001F4A1" + "</span> Show Hint / Formula</button>", hintId) : "",
                qLinkRoute,
                safeBadge
            );
        }

        string subTitle = subjectData.GetStr("title").Replace(" Section", "").Replace(" Chapters", "");
        string firstQStd = "";
        if (solutions.Count > 0) {
            firstQStd = StripHtmlForSeo(solutions[0].GetStr("q", ""));
            if (firstQStd.Length > 95) firstQStd = firstQStd.Substring(0, 95);
        }

        string seoTitle = string.Format("NCERT Solutions for Class 9 {0} {1} - SolveSpot", subTitle, cleanTitle);
        string seoDesc = string.Format("NCERT Class 9 {0} {1} textbook solutions ({2} solved questions). {3}",
            subTitle, cleanTitle, solutions.Count, !string.IsNullOrEmpty(firstQStd) ? "Includes: " + firstQStd + "..." : "").Trim();

        string faqSchema = BuildFaqJsonLd(solutions);
        string html = BuildPageHtml(route, seoTitle, seoDesc, subKey, "solution-view", backHref, backText, headingHtml, stack.ToString(), faqSchema);
        WriteRoutePage(route, html, true);
    }

    public void WriteSitemap(string dateStr) {
        StringBuilder sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        foreach (string r in GeneratedRoutes) {
            string loc = string.IsNullOrEmpty(r) ? "https://solvespot.in/" : ("https://solvespot.in/" + r);
            string priority = "0.85";
            string changefreq = "weekly";
            if (string.IsNullOrEmpty(r)) {
                priority = "1.0";
            } else if (r == "about" || r == "privacy" || r == "terms" || r == "contact") {
                priority = "0.5";
                changefreq = "monthly";
            } else if (r.StartsWith("subject/") && r.Split('/').Length == 2) {
                priority = "0.9";
            } else if (r.Contains("/chapter/")) {
                priority = "0.85";
            } else {
                priority = "0.8";
            }
            sb.AppendLine("  <url>");
            sb.AppendLine("    <loc>" + loc + "</loc>");
            sb.AppendLine("    <lastmod>" + dateStr + "</lastmod>");
            sb.AppendLine("    <changefreq>" + changefreq + "</changefreq>");
            sb.AppendLine("    <priority>" + priority + "</priority>");
            sb.AppendLine("  </url>");
        }
        sb.AppendLine("</urlset>");
        File.WriteAllText(Path.Combine(rootDir, "sitemap.xml"), sb.ToString(), utf8NoBom);
    }
}
'@

$workspaceDir = "c:\Users\DELL\OneDrive\Desktop\Aura Farming"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host "[1/4] Reading master template (index.html) and database (script.js)..."
$templateHtml = [System.IO.File]::ReadAllText((Join-Path $workspaceDir "index.html"), $utf8NoBom)
$scriptText = [System.IO.File]::ReadAllText((Join-Path $workspaceDir "script.js"), $utf8NoBom)

$startIdx = $scriptText.IndexOf("const ncertDatabase =")
$braceStart = $scriptText.IndexOf("{", $startIdx)
$endIdx = $scriptText.IndexOf("let currentSubjectKey =")
$dbSlice = $scriptText.Substring($braceStart, $endIdx - $braceStart)

Write-Host "[2/4] Parsing ncertDatabase..."
$parser = New-Object JsParser($dbSlice)
$db = $parser.ParseValue()

Write-Host "[3/4] Generating static HTML pages..."
$builder = New-Object SsgBuilder($workspaceDir, $templateHtml, $db)
$builder.GenerateAll()

Write-Host "[4/4] Updating sitemap.xml..."
$builder.WriteSitemap("2026-10-31")

Write-Host ("SSG Build Complete! Generated {0} static HTML files and {1} canonical sitemap URLs." -f $builder.TotalFilesWritten, $builder.GeneratedRoutes.Count)
