/* =============================================================================
   Portfolio content. Source of truth: KG_Harish_Patel_Resume_1.pdf.
   Edit text here; main.js renders it. Anything not in the resume is not here.
   ========================================================================== */
window.PORTFOLIO = {
  profile: {
    name: 'K G Harish Patel',
    first: 'Harish',
    title: 'Computer Science Undergraduate',
    interests: ['Computer vision', '3D reconstruction', 'Object detection', 'Efficient edge deep learning', 'LLM evaluation'],
    summary: 'Final-year Computer Science undergraduate seeking a research internship in computer vision and machine learning, with hands-on work in 3D reconstruction, object detection and efficient on-device inference. At ProEmbSys Technologies, I build a real-time PCB defect-inspection system, turning open-ended production problems into measurable questions and evaluating every model change against baselines on precision, recall and mAP@0.5.',
    method: 'Across projects in Structure-from-Motion, parameter-efficient LLM fine-tuning and graph-based retrieval, I follow a disciplined experimental workflow of controlled baselines, documented trade-offs and reproducible pipelines, backed by strong foundations in algorithms and computer architecture.',
    location: 'Bengaluru, India',
    email: 'kgharishpatel@gmail.com',
    github: 'https://github.com/harishhh-paaatel',
    linkedin: 'https://www.linkedin.com/in/kg-harish-patel',
    resume: 'assets/KG_Harish_Patel_Resume.pdf'
  },

  skills: [
    { group: 'Languages', items: ['Python', 'C', 'SQL', 'JavaScript', 'TypeScript'] },
    { group: 'ML & Vision', items: ['PyTorch', 'Scikit-learn', 'OpenCV', 'YOLOv8', 'MobileNet-SSD', 'TensorFlow Lite', 'Structure-from-Motion', 'LoRA / QLoRA', 'RAG', 'GraphRAG'] },
    { group: 'Systems & Tools', items: ['Linux', 'Git', 'Docker', 'FastAPI', 'PostgreSQL', 'SQLite', 'NumPy', 'Pandas', 'NetworkX', 'AirSim', 'Unreal Engine', 'Jenkins CI/CD'] },
    { group: 'Research methods', items: ['Experimental design', 'Baseline comparisons', 'Trade-off studies', 'Precision / recall / mAP evaluation', 'Dataset validation', 'Error analysis'] }
  ],

  /* The four doors. Order here is the order on the wall. */
  categories: [
    { id: 'software', plate: 'Software & Web Development', short: 'Software & Web', tone: 'terracotta',
      blurb: 'Building scalable applications, backend systems and interactive digital experiences through thoughtful engineering.' },
    { id: 'ai', plate: 'AI / ML & Research', short: 'AI / ML & Research', tone: 'umber',
      blurb: 'Agentic systems, local generative models and parameter-efficient fine-tuning, built on controlled experiments and honest baselines.' },
    { id: 'app', plate: 'App Development', short: 'App Development', tone: 'clay',
      blurb: 'Applications built with an internship team to inspect printed circuit boards automatically.' },
    { id: 'embedded', plate: 'Embedded Systems & Intelligent Systems', short: 'Embedded & Intelligent', tone: 'walnut',
      blurb: 'Vision and machine learning on constrained hardware, and simulated autonomous drone navigation: work measured in accuracy, latency and reconstruction quality.' }
  ],

  /* Canonical project registry. Every project exists exactly once, here, with one primary category
     and a stable id. Category pages are built by filtering this list; nothing is copied per category.
     role: 'Individual' | 'Team' (omitted where the source does not say).
     Only documented facts are listed; nothing here is a benchmark or an estimate. */
  projects: [
    {
      id: 'libcheck', category: 'software', type: 'Full-stack web application', kicker: 'Web application · Dec 2025',
      title: 'LibCheck — Library Management System',
      links: [{ label: 'GitHub profile', href: 'profile' }],
      role: 'Individual',
      status: 'completed',
      summary: 'A three-tier library management app: a JavaScript interface, a FastAPI REST API and a SQLite database, with every endpoint documented in OpenAPI.',
      stack: ['Python', 'FastAPI', 'SQLAlchemy', 'SQLite', 'JavaScript'],
      points: [
        'Designed a 3-tier app (JavaScript UI, FastAPI REST API, SQLite) across 4 modules, documenting every endpoint in OpenAPI.',
        'Modeled a relational SQLAlchemy schema that automates loans, fines and book availability with consistent records.',
        'Secured the API with JWT authentication and role-based access control, adding audit logging for every state change.',
        'Shipped 7 user-facing features end to end, including smart search, analytics dashboards and email notifications.'
      ],
      outcomes: ['4 modules and 7 user-facing features shipped end to end', 'Every endpoint documented in OpenAPI'],
      art: 'books'
    },
    {
      id: 'graphrag', category: 'software', type: 'Backend service · LLM pipeline', kicker: 'Backend · LLM service · Aug 2026',
      title: 'GraphRAG Knowledge System',
      links: [{ label: 'GitHub profile', href: 'profile' }],
      role: 'Individual',
      status: 'completed',
      summary: 'An LLM pipeline that turns unstructured documents into a knowledge graph, benchmarked against a chunk-based RAG baseline and served through a FastAPI REST service.',
      stack: ['Python', 'FastAPI', 'LLMs', 'NetworkX', 'Docker'],
      points: [
        'Architected an LLM pipeline extracting entities and relations from unstructured documents into a NetworkX knowledge graph.',
        'Benchmarked graph-based answer accuracy against a chunk-based RAG baseline, verifying LLM outputs rather than trusting them.',
        'Exposed retrieval and question answering through a FastAPI REST service with defined JSON request/response contracts.',
        'Containerized the system with Docker so experiments and demos run reproducibly across environments.'
      ],
      art: 'graph'
    },
    {
      id: 'autoops', category: 'ai', type: 'Planned engineering project', kicker: 'Agentic AI · DevOps automation · Upcoming',
      status: 'upcoming',
      role: 'Team', roleNote: 'Planned as a team project',
      title: 'AutoOps AI',
      summary: 'An agentic AI-based DevOps automation system designed to automate infrastructure operations through specialised AI agents.',
      concept: 'Instead of one monolithic tool, specialised AI agents each take responsibility for a part of infrastructure operations, working together as a single DevOps automation system.',
      stack: [],
      points: [],
      links: [],
      art: 'agent'
    },
    {
      id: 'wan-video', category: 'ai', type: 'Local generative AI system', kicker: 'AI video generation · Built for my internship company',
      title: 'Local GPU-Powered AI Video Generation System',
      role: 'Individual',
      status: 'completed',
      summary: 'A local AI video generation system built on Wan 2.0. It runs on my laptop’s own GPU, so videos are generated without paying per-generation credits.',
      problem: 'Hosted video-generation services charge credits for every generation, while the internship company needed video for its advertising and promotional content.',
      stack: ['Wan 2.0', 'Local GPU'],
      points: [
        'Integrated Wan 2.0 into a local video generation workflow.',
        'Generation runs on the available local GPU, not on a cloud platform.',
        'No per-generation credit requirement.',
        'Built for a practical company use case: advertising and promotional content.',
        'Independently developed.'
      ],
      note: 'Speed and output depend on the GPU available. No benchmarks are claimed.',
      art: 'video'
    },
    {
      id: 'lora', category: 'ai', type: 'LLM fine-tuning study', kicker: 'LLM research · Jul 2026',
      title: 'LoRA / QLoRA LLM Fine-Tuning',
      links: [{ label: 'GitHub profile', href: 'profile' }],
      role: 'Individual',
      status: 'completed',
      summary: 'Parameter-efficient fine-tuning of an open-source LLM, comparing LoRA and QLoRA on GPU memory, compute and benchmark results.',
      stack: ['Python', 'PyTorch', 'LLMs', 'LoRA', 'QLoRA'],
      points: [
        'Fine-tuned an open-source LLM with parameter-efficient LoRA and QLoRA adapters for a task-specific use case.',
        'Ran a controlled LoRA-versus-QLoRA comparison, profiling GPU memory and compute to document performance-resource trade-offs.',
        'Automated dataset validation checks for format, duplicates and quality before every training run.',
        'Benchmarked outputs against the pre-fine-tuning baseline on defined evaluation metrics to isolate the effect of each change.'
      ],
      art: 'adapter'
    },
    {
      id: 'missing-component', category: 'app', type: 'Internship project · team', kicker: 'PCB inspection · Internship',
      title: 'Missing Component Detection System',
      role: 'Team',
      status: 'completed',
      summary: 'An application developed during my internship, as part of a team, that identifies missing electronic components on PCBs through an inspection workflow.',
      problem: 'Missing components have to be caught during board inspection. This application automates that check.',
      stack: [],
      points: [
        'Developed by an internship team, not independently.',
        'Identifies missing electronic components on PCBs through an inspection workflow.',
        'A separate application from the Missing PCB Trace Detection System.'
      ],
      art: 'components'
    },
    {
      id: 'missing-trace', category: 'app', type: 'Internship project · team', kicker: 'PCB inspection · Internship',
      title: 'Missing PCB Trace Detection System',
      role: 'Team',
      status: 'completed',
      summary: 'An internship project, developed by a team, that identifies missing PCB traces before electronic components are placed on the board.',
      problem: 'A missing trace should be found while the board is still bare, before components are placed on it.',
      stack: [],
      points: [
        'Developed by an internship team, not independently.',
        'Detects missing traces before component placement.',
        'A separate application from the Missing Component Detection System.'
      ],
      art: 'trace'
    },
    {
      id: 'pcb-defect', category: 'embedded', type: 'Internship project · vision on edge hardware', kicker: 'Internship · ProEmbSys Technologies · Sep 2026 — Now',
      title: 'Real-time PCB Defect Inspection',
      status: 'ongoing',
      summary: 'A real-time vision system that detects four PCB defect classes and is profiled for latency, FPS, memory and energy on constrained hardware.',
      stack: ['Python', 'OpenCV', 'YOLOv8', 'MobileNet-SSD', 'TensorFlow Lite'],
      points: [
        'Developed a real-time Python/OpenCV vision system detecting 4 PCB defect classes (shorts, opens, missing solder, misalignment).',
        'Fine-tuned YOLOv8 and MobileNet-SSD through transfer learning, running per-class error analysis to trace and reduce false positives.',
        'Evaluated every model iteration against the prior baseline on precision, recall and mAP@0.5, accepting only non-regressing changes.',
        'Profiled latency, FPS, SRAM/Flash footprint and energy on constrained hardware, documenting accuracy-efficiency trade-offs.'
      ],
      note: 'Internship work, described at a high level only.',
      art: 'pcb'
    },
    {
      id: 'drone', category: 'embedded', type: 'Simulation · 3D reconstruction', kicker: 'Drone navigation · Jun 2026',
      title: 'Drone Navigation & 3D Reconstruction',
      links: [{ label: 'GitHub profile', href: 'profile' }],
      status: 'completed',
      summary: 'A controller-based drone simulation in AirSim and Unreal Engine that captures posed image sequences and reconstructs 3D scenes with Structure-from-Motion.',
      stack: ['Python', 'AirSim', 'Unreal Engine', 'OpenCV', 'NumPy'],
      points: [
        'Developed a controller-based drone navigation simulation in AirSim and Unreal Engine to generate repeatable flight-path data.',
        'Automated a synchronized OpenCV data-acquisition pipeline pairing every RGB frame with its simulator camera pose.',
        'Reconstructed 3D scenes from the captured image sequences using Structure-from-Motion (SfM).',
        'Placed 2nd at the Innovotsava 2026 Drone Fair, judged on innovation and technical problem-solving.'
      ],
      outcomes: ['2nd place, Innovotsava 2026 Drone Fair'],
      art: 'drone'
    }
  ],

  /* Timeline for the "story" section, newest first. */
  story: [
    {
      year: '2026', period: 'Sep 2026 — Now',
      title: 'Project Intern, Edge AI & Machine Vision', org: 'ProEmbSys Technologies Pvt. Ltd., Bengaluru',
      points: [
        'Developed a real-time Python/OpenCV vision system detecting 4 PCB defect classes (shorts, opens, missing solder, misalignment).',
        'Fine-tuned YOLOv8 and MobileNet-SSD through transfer learning, running per-class error analysis to trace and reduce false positives.',
        'Evaluated every model iteration against the prior baseline on precision, recall and mAP@0.5, accepting only non-regressing changes.',
        'Profiled latency, FPS, SRAM/Flash footprint and energy on constrained hardware, documenting accuracy-efficiency trade-offs.'
      ]
    },
    {
      year: '2025', period: 'Jul 2025 — Now',
      title: 'Co-Founder & Content Lead', org: 'Coding Kannadiga (YouTube)',
      points: ['Published 90 tutorials on Python, DSA and AI (273 subscribers).']
    },
    {
      year: '2025', period: '2025',
      title: 'Certifications', org: 'Forage · Intel',
      points: ['JPMorgan Chase Software Engineering Job Simulation (Forage, 2025).', 'Deloitte Cyber Job Simulation (Forage, 2025).', 'AI Aware (Intel, 2025).']
    },
    {
      year: '2024', period: 'Sep 2024 — Dec 2024',
      title: 'Artificial Intelligence Intern', org: 'Tech Mindsparc Innovations Pvt. Ltd., Remote',
      points: [
        'Built supervised classification models end to end in Python (Scikit-learn, Pandas, NumPy), from data preparation to evaluation.',
        'Engineered data-validation and feature-extraction pipelines on tabular datasets, improving accuracy over the baseline model.',
        'Designed a metric-based evaluation gate that rejected any change regressing model performance, keeping results reproducible.',
        'Delivered iterative experiments over 4 months on a remote Agile team, applying mentor code-review feedback every cycle.'
      ]
    },
    {
      year: '2023', period: 'Sep 2023 — Aug 2027 (expected)',
      title: 'B.E. in Computer Science and Engineering', org: 'Maharaja Institute of Technology, Mysore',
      points: ['Relevant coursework: Data Structures & Algorithms, Machine Learning, Operating Systems, Computer Architecture, DBMS (SQL), OOP.']
    }
  ]
};
