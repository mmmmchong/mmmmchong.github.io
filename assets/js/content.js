/*
 * 网站内容：修改这里即可更新所有页面。
 * 个人资料、教育经历与 HSPFuzzer 论文已填写；博客仍为占位示例。
 * 留空的 email、photo、cvUrl 和链接不会显示。
 */
window.SITE_CONTENT = {
  profile: {
    name: "Zhewei Xia", // 所有页面的姓名、标题和标识统一读取这里。
    nameZh: "夏哲炜", // 同一行时带括号，中文另起一行时不带；留空则只显示英文。
    role: "Ph.D. Student",
    department: "Faculty of Cybersecurity & Cryptology",
    institution: "Xidian University",
    location: "Xi'an, Shaanxi, China",
    email: "xiazwie@stu.xidian.edu.cn",
    photo: "assets/images/portrait.jpg", // 例如 assets/images/avatar.jpg；也支持 https:// 图片链接。
    intro: "I am a Ph.D. student in Cyberspace Security at Xidian University, advised by Prof. {sunCong}. I received my bachelor's degree with honors in Cyberspace Security from the Honors College at Hangzhou Dianzi University, where I was advised by Prof. {zengYingpei}.",
    introLinks: { // 简介中的 {键名} 自动显示为对应姓名链接。
      sunCong: { label: "Sun Cong", url: "https://web.xidian.edu.cn/suncong/index.html" },
      zengYingpei: { label: "Zeng Yingpei", url: "https://zyingp.github.io/" }
    },
    interests: ["Software security", "Fuzzing", "Reverse engineering", "AI infrastructure(maybe)"],
    links: [
      { label: "Google Scholar", url: "" },
      { label: "GitHub", url: "https://github.com/mmmmchong" },
      { label: "ORCID", url: "" }
    ],
    cvUrl: "" // 例如 assets/files/cv.pdf。
  },
  education: [ // 按希望展示的顺序填写；school（学院）和 period（时间）可留空。
    {
      institution: "Xidian University",
      school: "Faculty of Cybersecurity & Cryptology",
      degree: "Ph.D.",
      major: "Cyberspace Security",
      period: "2026–Present"
    },
    {
      institution: "Hangzhou Dianzi University",
      school: "Honors College",
      degree: "Bachelor's degree with honors",
      major: "Cyberspace Security",
      period: "2022–2026"
    }
  ],
  publications: [
    {
      id: "HSPFuzzer",
      title: "HSPFuzzer: High-Speed Network Protocol Fuzzing With Connection Reuse",
      authors: "Zhewei Xia, Yingpei Zeng*, Xiangpu Song, Shanqing Guo*, Ting Wu", // 保留论文发表时的署名。
      venue: "IEEE Internet of Things Journal, Vol. 12, No. 19",
      year: 2025,
      example: false, // 换成真实论文后设为 false。
      links: [ // 可选；填写真实地址后才显示对应的链接。
        { label: ".pdf", url: "assets/files/hspfuzzer.pdf" },
        { label: "code", url: "https://github.com/hspfuzzer/hspfuzzer" },
        { label: "doi", url: "https://doi.org/10.1109/JIOT.2025.3590178" }
      ]
    }
  ],
  posts: [
    {
      slug: "hello-world",
      title: "Research notes start here",
      date: "2026-10-09", // YYYY-MM-DD；按日期倒序显示。
      excerpt: "Notes on papers, experiments, and questions still waiting for answers.",
      example: true,
      paragraphs: [
        "This is the first sample post on this blog. Alongside published research, I hope to share ideas that are still taking shape.",
        "Research often starts with a question: Why does this happen? Where do current methods fall short? Is there a simpler explanation? Writing these questions down helps organize my thinking.",
        "This space may grow into a collection of paper notes, experiment logs, technical posts, and observations from everyday learning. Ideas can develop over time, without rushing to a conclusion."
      ]
    }
  ]
};
