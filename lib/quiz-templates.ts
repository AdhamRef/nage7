import type { QuizMatchMode } from "@/lib/quiz";

export interface QuizTemplateValues {
  question: string;
  hint: string;
  matchMode: QuizMatchMode;
  expectedOutput: string;
  caseSensitive: boolean;
  successMessage: string;
  starterHtml: string;
  starterCss: string;
  starterJs: string;
}

export interface QuizTemplate {
  id: string;
  label: string;
  /** Shown under the button so the instructor knows what they're inserting. */
  description: string;
  tag: "JS" | "HTML" | "CSS" | "DOM";
  values: QuizTemplateValues;
}

/**
 * Ready-made exercises the instructor can drop into a chapter and tweak.
 * Every one of them already passes its own expected output when solved.
 */
export const quizTemplates: QuizTemplate[] = [
  {
    id: "hello-world",
    label: "أول رسالة",
    description: "طباعة نص ثابت باستخدام console.log",
    tag: "JS",
    values: {
      question: "اطبع الجملة التالية في الـ console بالضبط:\nمرحبا بالعالم",
      hint: "استخدم console.log وضع النص بين علامتي تنصيص.",
      matchMode: "CONSOLE",
      expectedOutput: "مرحبا بالعالم",
      caseSensitive: false,
      successMessage: "جامد! دي أول رسالة تطبعها بالكود 🎉",
      starterHtml: "",
      starterCss: "",
      starterJs: "// اطبع الرسالة هنا\n",
    },
  },
  {
    id: "loop-numbers",
    label: "حلقة تكرار",
    description: "طباعة الأرقام من 1 إلى 5 بحلقة for",
    tag: "JS",
    values: {
      question:
        "اطبع الأرقام من 1 لـ 5، كل رقم في سطر لوحده، باستخدام حلقة تكرار.",
      hint: "for (let i = 1; i <= 5; i++) { ... }",
      matchMode: "CONSOLE",
      expectedOutput: "1\n2\n3\n4\n5",
      caseSensitive: false,
      successMessage: "أحسنت! أتقنت حلقات التكرار 🎉",
      starterHtml: "",
      starterCss: "",
      starterJs: "// اكتب الحلقة هنا\n",
    },
  },
  {
    id: "sum-function",
    label: "دالة الجمع",
    description: "كتابة دالة ترجع ناتج جمع رقمين",
    tag: "JS",
    values: {
      question:
        "اكتب دالة اسمها sum تستقبل رقمين وترجع ناتج جمعهما، ثم اطبع نتيجة sum(7, 5).",
      hint: "استخدم return داخل الدالة، ثم console.log(sum(7, 5)).",
      matchMode: "CONSOLE",
      expectedOutput: "12",
      caseSensitive: false,
      successMessage: "رائع! الدوال هي أساس تنظيم الكود 🎉",
      starterHtml: "",
      starterCss: "",
      starterJs: "function sum(a, b) {\n  // أكمل هنا\n}\n\nconsole.log(sum(7, 5));\n",
    },
  },
  {
    id: "even-numbers",
    label: "الأعداد الزوجية",
    description: "تصفية مصفوفة باستخدام filter",
    tag: "JS",
    values: {
      question:
        "من المصفوفة المعطاة، اطبع الأعداد الزوجية فقط مفصولة بفاصلة (مثال: 2,4,6).",
      hint: "استخدم filter مع الشرط n % 2 === 0 ثم join(',').",
      matchMode: "CONSOLE",
      expectedOutput: "2,4,6,8",
      caseSensitive: false,
      successMessage: "ممتاز! أتقنت التعامل مع المصفوفات 🎉",
      starterHtml: "",
      starterCss: "",
      starterJs:
        "const numbers = [1, 2, 3, 4, 5, 6, 7, 8];\n\n// اطبع الأعداد الزوجية هنا\n",
    },
  },
  {
    id: "html-heading",
    label: "عنوان وفقرة",
    description: "بناء صفحة HTML بسيطة — تصحيح بالنص الظاهر",
    tag: "HTML",
    values: {
      question:
        "أنشئ عنواناً رئيسياً <h1> نصه «دورة البرمجة» وتحته فقرة <p> نصها «أهلاً بك».",
      hint: "استخدم وسم h1 ووسم p داخل تبويب HTML.",
      matchMode: "TEXT",
      expectedOutput: "دورة البرمجة\nأهلاً بك",
      caseSensitive: false,
      successMessage: "جامد! دي أول صفحة HTML تبنيها 🎉",
      starterHtml: "<!-- اكتب العنوان والفقرة هنا -->\n",
      starterCss: "",
      starterJs: "",
    },
  },
  {
    id: "css-card",
    label: "تنسيق بطاقة",
    description: "تنسيق عنصر بـ CSS مع نص ظاهر محدد",
    tag: "CSS",
    values: {
      question:
        "نسّق العنصر ذا الكلاس card ليكون بخلفية زرقاء ونص أبيض وحواف دائرية، واجعل نصه «بطاقة منسقة».",
      hint: "في تبويب CSS استخدم .card { background: ...; color: ...; border-radius: ...; }",
      matchMode: "TEXT",
      expectedOutput: "بطاقة منسقة",
      caseSensitive: false,
      successMessage: "جميل! بدأت تتحكم في شكل الصفحة 🎉",
      starterHtml: '<div class="card">بطاقة منسقة</div>\n',
      starterCss: ".card {\n  /* أضف التنسيق هنا */\n}\n",
      starterJs: "",
    },
  },
  {
    id: "dom-update",
    label: "تعديل عنصر بالـ DOM",
    description: "تغيير محتوى عنصر من JavaScript",
    tag: "DOM",
    values: {
      question:
        "غيّر محتوى العنصر ذي المعرف output بالجافاسكريبت ليصبح «تم التحديث».",
      hint: "document.getElementById('output').textContent = '...'",
      matchMode: "TEXT",
      expectedOutput: "تم التحديث",
      caseSensitive: false,
      successMessage: "برافو! بقيت بتتحكم في الصفحة بالكود 🎉",
      starterHtml: '<div id="output">النص القديم</div>\n',
      starterCss: "",
      starterJs: "// عدّل محتوى العنصر هنا\n",
    },
  },
  {
    id: "longest-word",
    label: "أطول كلمة",
    description: "تمرين منطقي على المصفوفات والنصوص",
    tag: "JS",
    values: {
      question: "من المصفوفة المعطاة، اطبع أطول كلمة.",
      hint: "قارن طول كل كلمة (word.length) واحتفظ بالأطول.",
      matchMode: "CONSOLE",
      expectedOutput: "javascript",
      caseSensitive: false,
      successMessage: "جامد! ده تفكير برمجي سليم 🎉",
      starterHtml: "",
      starterCss: "",
      starterJs:
        'const words = ["html", "css", "javascript", "react"];\n\n// اطبع أطول كلمة هنا\n',
    },
  },
];
