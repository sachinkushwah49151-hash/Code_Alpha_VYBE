/**
 * VYBE Expanded Community Dataset
 * Phase 1: 65 Distinct Fictional Users & 200 Realistic Community Posts
 * Deterministic IDs & Seed Keys for Idempotent Seeding
 */

const mongoose = require('mongoose');

const userOid = (n) => new mongoose.Types.ObjectId(`665f1a2b3c4d5e6f7a8b${String(n).padStart(4, '0')}`);
const postOid = (n) => new mongoose.Types.ObjectId(`665f1a2b3c4d5e6f7a8c${String(n).padStart(4, '0')}`);
const cmtOid  = (n) => new mongoose.Types.ObjectId(`665f1a2b3c4d5e6f7a8d${String(n).padStart(4, '0')}`);

// Curated reliable portrait avatars (Unsplash - 65 unique, natural human portraits)
const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', // 1: meera.k
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', // 2: aryanmehta
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', // 3: priyasharma
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', // 4: kabirsen
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', // 5: ananya.ux
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80', // 6: sidd_ray
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80', // 7: aisha.nair
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', // 8: rahulv
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', // 9: devika.codes
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', // 10: rohank
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', // 11: zoya.lens
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80', // 12: vikram.ai
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80', // 13: nehakapoor
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80', // 14: arjun.m
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', // 15: tara.reads
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80', // 16: karan.gill
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80', // 17: sana.type
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80', // 18: nikhilb
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=300&auto=format&fit=crop&q=80', // 19: ishita.c
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80', // 20: pranav.j
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80', // 21: elena.r
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&auto=format&fit=crop&q=80', // 22: lucasmeyer
  'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=300&auto=format&fit=crop&q=80', // 23: camille.l
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80', // 24: mateosilva
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80', // 25: aditi.design
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80', // 26: harsh.sec
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=300&auto=format&fit=crop&q=80', // 27: ritika.s
  'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300&auto=format&fit=crop&q=80', // 28: varun.d
  'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=300&auto=format&fit=crop&q=80', // 29: mayalp
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&auto=format&fit=crop&q=80', // 30: siddhi.j
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', // 31: rishi.ag
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80', // 32: nandini.photo
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300&auto=format&fit=crop&q=80', // 33: kunal.d
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80', // 34: shreya.g
  'https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=300&auto=format&fit=crop&q=80', // 35: omkar.p
  'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=300&auto=format&fit=crop&q=80', // 36: fatima.z
  'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=300&auto=format&fit=crop&q=80', // 37: yash.jain
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80', // 38: divya.s
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&auto=format&fit=crop&q=80', // 39: tanmay.b
  'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=300&auto=format&fit=crop&q=80', // 40: pallavi.j
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&auto=format&fit=crop&q=80', // 41: gaurav.b
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80', // 42: mira.sethi
  'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=300&auto=format&fit=crop&q=80', // 43: rehan.ali
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop&q=80', // 44: smriti.v
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=300&auto=format&fit=crop&q=80', // 45: abhishek.c
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&auto=format&fit=crop&q=80', // 46: chloe.dubois
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=300&auto=format&fit=crop&q=80', // 47: jayesh.p
  'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=300&auto=format&fit=crop&q=80', // 48: kritika.iyer
  'https://images.unsplash.com/photo-1500649297466-74794c70acfc?w=300&auto=format&fit=crop&q=80', // 49: manish.t
  'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=300&auto=format&fit=crop&q=80', // 50: pooja.h
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80', // 51: raghav.r
  'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=300&auto=format&fit=crop&q=80', // 52: sneha.n
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=300&auto=format&fit=crop&q=80', // 53: tushar.g
  'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=300&auto=format&fit=crop&q=80', // 54: vedant.k
  'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=300&auto=format&fit=crop&q=80', // 55: ayesha.s
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80', // 56: dhruv.r
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=300&auto=format&fit=crop&q=80', // 57: kavya.nair
  'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=300&auto=format&fit=crop&q=80', // 58: naman.o
  'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=300&auto=format&fit=crop&q=80', // 59: rhea.c
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=300&auto=format&fit=crop&q=80', // 60: saurabh.s
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80', // 61: anjali.m
  'https://images.unsplash.com/photo-1563351672-62b74891a28a?w=300&auto=format&fit=crop&q=80', // 62: kartik.a
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=300&auto=format&fit=crop&q=80', // 63: meghna.g
  'https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?w=300&auto=format&fit=crop&q=80', // 64: neeraj.c
  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=300&auto=format&fit=crop&q=80', // 65: zainab.a
];

// Curated reliable post media (Unsplash)
const MEDIA = {
  arch1: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
  ui1: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
  ui2: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
  shader: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
  desk1: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
  code1: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
  art1: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80',
  abstract1: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
  coffee1: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000&auto=format&fit=crop&q=80',
  books1: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&auto=format&fit=crop&q=80',
  street1: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1000&auto=format&fit=crop&q=80',
  studio1: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80',
  nature1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
  camera1: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80',
  notebook1: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&auto=format&fit=crop&q=80',
  server1: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80',
  laptop1: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  synth1: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
  minimal1: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
  board1: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
  kyoto1: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
  plant1: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1000&auto=format&fit=crop&q=80',
  typo1: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1000&auto=format&fit=crop&q=80',
  sketch1: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1000&auto=format&fit=crop&q=80',
};

// 65 Distinct Fictional Users (1..8 preserve original core creators)
const RAW_USERS = [
  // 1-8: Core creators
  { idx: 1, name: 'Meera Krishnan', username: 'meera.k', bio: 'product designer & systems thinker. crafting calm interfaces, design tokens, and visual essays from Bengaluru.', website: 'meerakrishnan.design', interests: ['design-systems', 'typography', 'architecture', 'minimalism'], avatar: AVATARS[0] },
  { idx: 2, name: 'Aryan Mehta', username: 'aryanmehta', bio: 'systems & infrastructure engineer. exploring modular monoliths, distributed state, and clean package boundaries.', website: 'aryanmehta.dev', interests: ['distributed-systems', 'golang', 'architecture', 'backend'], avatar: AVATARS[1] },
  { idx: 3, name: 'Priya Sharma', username: 'priyasharma', bio: 'architectural photographer documenting modernist and brutalist structures across South Asia.', website: 'priyasharma.photo', interests: ['photography', 'brutalism', 'architecture', 'film'], avatar: AVATARS[2] },
  { idx: 4, name: 'Kabir Sen', username: 'kabirsen', bio: 'creative technologist. writing shaders in GLSL, exploring procedural graphics and small indie games.', website: 'kabirsen.io', interests: ['webgl', 'shaders', 'gamedev', 'creative-coding'], avatar: AVATARS[3] },
  { idx: 5, name: 'Ananya Deshmukh', username: 'ananya.ux', bio: 'design systems lead. thoughtful about microcopy, component contracts, and cross-functional handoffs.', website: 'ananyaux.com', interests: ['ux-writing', 'accessibility', 'design-tokens', 'figma'], avatar: AVATARS[4] },
  { idx: 6, name: 'Siddharth Ray', username: 'sidd_ray', bio: 'backend developer. deep in Postgres internals, query optimization, and reliable storage architectures.', website: 'siddray.db', interests: ['postgresql', 'databases', 'performance', 'sql'], avatar: AVATARS[5] },
  { idx: 7, name: 'Aisha Nair', username: 'aisha.nair', bio: 'studio director @ craftlab. writing about creative rituals, context sharing, and studio operations.', website: 'craftlab.studio', interests: ['leadership', 'creative-direction', 'productivity', 'culture'], avatar: AVATARS[6] },
  { idx: 8, name: 'Rahul Verma', username: 'rahulv', bio: 'independent software engineer building focused tools. writing notes on real production constraints.', website: 'rahulverma.xyz', interests: ['indiedev', 'saas', 'engineering', 'startups'], avatar: AVATARS[7] },

  // 9-65: Expanded diverse community (developers, designers, students, photographers, founders, readers, tech enthusiasts)
  { idx: 9, name: 'Devika Menon', username: 'devika.codes', bio: 'compiler enthusiast & Rust contributor. turning type systems into helpful error messages.', website: 'devikamenon.rs', interests: ['rust', 'compilers', 'open-source', 'systems'], avatar: AVATARS[8] },
  { idx: 10, name: 'Rohan Kulkarni', username: 'rohank', bio: 'founder @ FinchNote. bootstrapping a local-first markdown workspace for researchers.', website: 'finchnote.app', interests: ['startups', 'local-first', 'markdown', 'bootstrapping'], avatar: AVATARS[9] },
  { idx: 11, name: 'Zoya Akhtar', username: 'zoya.lens', bio: 'street & documentary photographer on 35mm film. chasing monsoon reflections in Mumbai.', website: 'zoyalens.org', interests: ['street-photography', '35mm', 'cinema', 'visual-arts'], avatar: AVATARS[10] },
  { idx: 12, name: 'Vikramaditya Rao', username: 'vikram.ai', bio: 'ML systems engineer working on quantized inference & small language models on edge hardware.', website: 'vikramrao.ai', interests: ['machine-learning', 'edge-ai', 'python', 'hardware'], avatar: AVATARS[11] },
  { idx: 13, name: 'Neha Kapoor', username: 'nehakapoor', bio: 'product manager turned indie writer. publishing weekly essays on career pivots and calm ambition.', website: 'nehakapoor.substack.com', interests: ['career', 'writing', 'product', 'books'], avatar: AVATARS[12] },
  { idx: 14, name: 'Arjun Malhotra', username: 'arjun.m', bio: 'CS undergrad @ IIT-H. building an open-source terminal multiplexer and learning OS kernels.', website: 'github.com/arjunm', interests: ['linux', 'c-programming', 'student', 'open-source'], avatar: AVATARS[13] },
  { idx: 15, name: 'Tara Venkataraman', username: 'tara.reads', bio: 'literary critic, avid marginalia scribbler, and sci-fi archivist. 80 books/year without speed-reading.', website: 'tarareads.blog', interests: ['books', 'literature', 'sci-fi', 'essays'], avatar: AVATARS[14] },
  { idx: 16, name: 'Karanvir Gill', username: 'karan.gill', bio: 'iOS craftsperson obsessed with spring physics, haptic feedback, and fluid SwiftUI transitions.', website: 'karangill.dev', interests: ['ios', 'swiftui', 'animation', 'mobile'], avatar: AVATARS[15] },
  { idx: 17, name: 'Sana Qureshi', username: 'sana.type', bio: 'typeface designer exploring multiscript Devanagari + Latin editorial families.', website: 'sanatype.foundry', interests: ['typography', 'devanagari', 'graphic-design', 'print'], avatar: AVATARS[16] },
  { idx: 18, name: 'Nikhil Bhatia', username: 'nikhilb', bio: 'staff SRE. keeping Kubernetes clusters boring so everyone gets their weekends back.', website: 'nikhilbhatia.net', interests: ['devops', 'sre', 'kubernetes', 'observability'], avatar: AVATARS[17] },
  { idx: 19, name: 'Ishita Chatterjee', username: 'ishita.c', bio: 'computational biologist & PhD candidate. python, protein folding plots, and late-night filter coffee.', website: 'ishitac.science', interests: ['bioinformatics', 'data-viz', 'academia', 'coffee'], avatar: AVATARS[18] },
  { idx: 20, name: 'Pranav Joshi', username: 'pranav.j', bio: 'frontend architect. preaching web standards, zero-runtime CSS, and accessible DOM trees.', website: 'pranavjoshi.web', interests: ['web-standards', 'css', 'accessibility', 'javascript'], avatar: AVATARS[19] },
  { idx: 21, name: 'Elena Rostova', username: 'elena.r', bio: 'industrial designer sketching tactile hardware interfaces, mechanical knobs, and e-ink gadgets.', website: 'elenarostova.design', interests: ['industrial-design', 'hardware', 'e-ink', 'sketching'], avatar: AVATARS[20] },
  { idx: 22, name: 'Lucas Meyer', username: 'lucasmeyer', bio: 'Berlin-based sound designer & modular synth builder. scoring indie games and ambient spaces.', website: 'lucasmeyer.audio', interests: ['synth', 'audio', 'gamedev', 'creativity'], avatar: AVATARS[21] },
  { idx: 23, name: 'Camille Laurent', username: 'camille.l', bio: 'editorial illustrator & printmaker in Lyon. ink drawings, risograph zines, and slow mornings.', website: 'camillelaurent.fr', interests: ['illustration', 'risograph', 'print', 'art'], avatar: AVATARS[22] },
  { idx: 24, name: 'Mateo Silva', username: 'mateosilva', bio: 'fullstack engineer building civic-tech maps and public transit trackers.', website: 'mateosilva.dev', interests: ['civic-tech', 'maps', 'typescript', 'transit'], avatar: AVATARS[23] },
  { idx: 25, name: 'Aditi Kulkarni', username: 'aditi.design', bio: 'interaction designer @ health-tech startup. simplifying clinical dashboards for busy nurses.', website: 'aditikulkarni.in', interests: ['ux-design', 'healthtech', 'research', 'prototyping'], avatar: AVATARS[24] },
  { idx: 26, name: 'Harshvardhan Singh', username: 'harsh.sec', bio: 'application security researcher. threat modeling, cryptography primitives, and CTF writeups.', website: 'harshsec.io', interests: ['security', 'cryptography', 'infosec', 'linux'], avatar: AVATARS[25] },
  { idx: 27, name: 'ritika.sharma', username: 'ritika.s', name: 'Ritika Sengupta', bio: 'founder @ Looma Clay. small-batch ceramics and notes on running a physical craft business online.', website: 'loomaclay.com', interests: ['entrepreneurship', 'ceramics', 'craft', 'small-business'], avatar: AVATARS[26] },
  { idx: 28, name: 'Varun Dhawan', username: 'varun.d', bio: 'data engineer wrangling streaming pipelines, DuckDB analytics, and clean warehouse schemas.', website: 'varundata.dev', interests: ['data-engineering', 'duckdb', 'analytics', 'sql'], avatar: AVATARS[27] },
  { idx: 29, name: 'Maya Lin-Patel', username: 'mayalp', bio: 'urban sketcher & architecture grad student. comparing transit-oriented neighborhoods.', website: 'mayalinpatel.org', interests: ['urbanism', 'architecture', 'sketching', 'student'], avatar: AVATARS[28] },
  { idx: 30, name: 'Siddhi Joshi', username: 'siddhi.j', bio: 'staff technical writer. turning gnarly API specs into docs developers actually enjoy reading.', website: 'siddhijoshi.docs', interests: ['technical-writing', 'documentation', 'developer-experience', 'apis'], avatar: AVATARS[29] },
  { idx: 31, name: 'Rishi Agarwal', username: 'rishi.ag', bio: 'seed-stage B2B founder. sharing honest metrics, customer discovery calls, and sales mistakes.', website: 'rishiagarwal.vc', interests: ['startups', 'b2b', 'founders', 'growth'], avatar: AVATARS[30] },
  { idx: 32, name: 'Nandini Rao', username: 'nandini.photo', bio: 'natural light portrait & botanical photographer based in Coorg. medium format enthusiast.', website: 'nandinirao.studio', interests: ['photography', 'portraits', 'nature', 'medium-format'], avatar: AVATARS[31] },
  { idx: 33, name: 'Kunal Deshpande', username: 'kunal.d', bio: 'systems programmer & Neovim plugin author. optimizing build times and terminal workflows.', website: 'kunal.sh', interests: ['neovim', 'cli', 'productivity', 'zig'], avatar: AVATARS[32] },
  { idx: 34, name: 'Shreya Ghoshal', username: 'shreya.g', bio: 'edtech product designer creating interactive math playgrounds for middle schoolers.', website: 'shreyag.design', interests: ['edtech', 'interaction-design', 'learning', 'svg'], avatar: AVATARS[33] },
  { idx: 35, name: 'Omkar Patil', username: 'omkar.p', bio: 'embedded firmware engineer. C++, RTOS, custom PCBs, and logic analyzers on my kitchen table.', website: 'omkarpatil.hw', interests: ['embedded', 'hardware', 'electronics', 'cpp'], avatar: AVATARS[34] },
  { idx: 36, name: 'fatima.z', name: 'Fatima Zahra', username: 'fatima.z', bio: 'history of science reader & museum researcher. connecting 19th-century telegraphs to modern networks.', website: 'fatimazahra.ac', interests: ['history', 'books', 'research', 'technology'], avatar: AVATARS[35] },
  { idx: 37, name: 'Yashwardhan Jain', username: 'yash.jain', bio: 'design engineer bridging React, WebGL, and CSS scroll-driven animations.', website: 'yashjain.me', interests: ['design-engineering', 'css', 'react', 'motion'], avatar: AVATARS[36] },
  { idx: 38, name: 'divya.krishnan', name: 'Divya Subramanian', username: 'divya.s', bio: 'engineering manager leading a distributed team of 14. writing about async rituals and mentorship.', website: 'divyasubramanian.com', interests: ['engineering-management', 'career', 'remote-work', 'leadership'], avatar: AVATARS[37] },
  { idx: 39, name: 'Tanmay Bhatt', username: 'tanmay.b', bio: 'indie game developer crafting a narrative puzzle game about lost train stations.', website: 'tanmaygames.itch.io', interests: ['gamedev', 'pixel-art', 'storytelling', 'indie'], avatar: AVATARS[38] },
  { idx: 40, name: 'Pallavi Joshi', username: 'pallavi.j', bio: 'brand strategist & naming consultant for early-stage climate and consumer teams.', website: 'pallavijoshi.co', interests: ['branding', 'copywriting', 'strategy', 'startups'], avatar: AVATARS[39] },
  { idx: 41, name: 'Gaurav Bansal', username: 'gaurav.b', bio: 'open-source maintainer & Node.js performance tuner. flamegraphs never lie.', website: 'gauravbansal.dev', interests: ['nodejs', 'javascript', 'performance', 'open-source'], avatar: AVATARS[40] },
  { idx: 42, name: 'Mira Sethi', username: 'mira.sethi', bio: 'bookshop co-owner & weekend essayist. curating translated fiction and independent presses.', website: 'mirasethi.books', interests: ['books', 'indie-bookshops', 'reading', 'culture'], avatar: AVATARS[41] },
  { idx: 43, name: 'rehan.ali', name: 'Rehan Ali', username: 'rehan.ali', bio: 'mobile photographer & travel diarist capturing Himalayan mountain passes and tea stalls.', website: 'rehanali.visuals', interests: ['photography', 'travel', 'mountains', 'storytelling'], avatar: AVATARS[42] },
  { idx: 44, name: 'Smriti Verma', username: 'smriti.v', bio: 'senior UX researcher. field studies, usability testing, and listening before wireframing.', website: 'smritiverma.ux', interests: ['ux-research', 'psychology', 'product', 'design'], avatar: AVATARS[43] },
  { idx: 45, name: 'Abhishek Chatterjee', username: 'abhishek.c', bio: 'distributed databases engineer working on consensus protocols and deterministic simulation testing.', website: 'abhishekc.systems', interests: ['raft', 'distributed-systems', 'testing', 'rust'], avatar: AVATARS[44] },
  { idx: 46, name: 'Chloé Dubois', username: 'chloe.dubois', bio: 'creative coder & generative plotter artist in Paris. SVG algorithms and fountain pens.', website: 'chloedubois.art', interests: ['generative-art', 'plotter', 'creative-coding', 'svg'], avatar: AVATARS[45] },
  { idx: 47, name: 'jayesh.patel', name: 'Jayesh Patel', username: 'jayesh.p', bio: 'bootstrapped SaaS founder ($18k MRR). building boring billing utilities for freelancers.', website: 'jayeshpatel.co', interests: ['indiehackers', 'saas', 'bootstrapping', 'finance'], avatar: AVATARS[46] },
  { idx: 48, name: 'Kritika Iyer', username: 'kritika.iyer', bio: 'classical carnatic violinist & acoustics researcher studying digital audio synthesis.', website: 'kritikaiyer.music', interests: ['music', 'dsp', 'acoustics', 'creativity'], avatar: AVATARS[47] },
  { idx: 49, name: 'Manish Tiwari', username: 'manish.t', bio: 'staff frontend engineer focused on browser rendering pipelines, Core Web Vitals, and memory leaks.', website: 'manishtiwari.perf', interests: ['browsers', 'performance', 'webperf', 'javascript'], avatar: AVATARS[48] },
  { idx: 50, name: 'Pooja Hegde', username: 'pooja.h', bio: 'sustainability researcher & climate-tech analyst tracking grid battery storage and solar software.', website: 'poojahegde.earth', interests: ['climate-tech', 'energy', 'data', 'research'], avatar: AVATARS[49] },
  { idx: 51, name: 'Raghavendra Rao', username: 'raghav.r', bio: 'veteran C/UNIX programmer. 20 years of debugging sockets, signals, and Makefiles.', website: 'raghavrao.org', interests: ['unix', 'c-programming', 'networking', 'debugging'], avatar: AVATARS[50] },
  { idx: 52, name: 'Sneha Nambiar', username: 'sneha.n', bio: 'packaging & tactile brand designer. obsessed with paper stocks, embossing, and sustainable ink.', website: 'snehanambiar.studio', interests: ['packaging', 'graphic-design', 'print', 'craft'], avatar: AVATARS[51] },
  { idx: 53, name: 'Tushar Gupta', username: 'tushar.g', bio: 'final-year CS student & hackathon builder. shipping weekend prototypes and learning in public.', website: 'tushargupta.xyz', interests: ['buildinpublic', 'student', 'webdev', 'hackathons'], avatar: AVATARS[52] },
  { idx: 54, name: 'Vedant Kulkarni', username: 'vedant.k', bio: 'fintech backend engineer. idempotency keys, double-entry ledgers, and zero-downtime migrations.', website: 'vedantk.fin', interests: ['fintech', 'payments', 'backend', 'databases'], avatar: AVATARS[53] },
  { idx: 55, name: 'Ayesha Siddiqui', username: 'ayesha.s', bio: 'architect & daylighting consultant designing courtyards and passive cooling for tropical homes.', website: 'ayeshasiddiqui.arch', interests: ['architecture', 'sustainability', 'design', 'interiors'], avatar: AVATARS[54] },
  { idx: 56, name: 'Dhruv Rathee', username: 'dhruv.r', bio: 'science communicator & data visualization creator making complex economics intuitive.', website: 'dhruvr.viz', interests: ['data-viz', 'storytelling', 'economics', 'education'], avatar: AVATARS[55] },
  { idx: 57, name: 'Kavya Nair', username: 'kavya.nair', bio: 'product copywriter & content strategist. helping developer tools sound human, not corporate.', website: 'kavyanair.words', interests: ['copywriting', 'devtools', 'content', 'marketing'], avatar: AVATARS[56] },
  { idx: 58, name: 'Naman Ojha', username: 'naman.o', bio: 'full-time open source developer working on Vite plugins and fast TypeScript bundlers.', website: 'namanojha.dev', interests: ['vite', 'typescript', 'tooling', 'open-source'], avatar: AVATARS[57] },
  { idx: 59, name: 'Rhea Chakraborty', username: 'rhea.c', bio: 'digital wellness writer & Notion minimalist. designing low-friction personal knowledge systems.', website: 'rheac.notes', interests: ['productivity', 'pkm', 'writing', 'minimalism'], avatar: AVATARS[58] },
  { idx: 60, name: 'Saurabh Shukla', username: 'saurabh.s', bio: 'astrophotographer & hardware tinkerer. stacking deep-sky exposures from Ladakh.', website: 'saurabhastro.photo', interests: ['astrophotography', 'photography', 'space', 'optics'], avatar: AVATARS[59] },
  { idx: 61, name: 'Anjali Menon', username: 'anjali.m', bio: 'design educator & workshop facilitator teaching visual hierarchy to early-career engineers.', website: 'anjalimenon.edu', interests: ['design-education', 'ui-design', 'mentorship', 'workshops'], avatar: AVATARS[60] },
  { idx: 62, name: 'Kartik Aryan', username: 'kartik.a', bio: 'cloud infrastructure architect. Terraform modules, FinOps cost shaving, and bare-metal benchmarks.', website: 'kartikcloud.io', interests: ['cloud', 'terraform', 'infra', 'benchmarks'], avatar: AVATARS[61] },
  { idx: 63, name: 'Meghna Gulzar', username: 'meghna.g', bio: 'documentary filmmaker & screenwriter researching oral histories and regional craft traditions.', website: 'meghnagulzar.film', interests: ['filmmaking', 'storytelling', 'culture', 'cinema'], avatar: AVATARS[62] },
  { idx: 64, name: 'Neeraj Chopra', username: 'neeraj.c', bio: 'sports biomechanics analyst & Python hobbyist tracking velocity curves and recovery metrics.', website: 'neerajmetrics.io', interests: ['sports-science', 'python', 'analytics', 'fitness'], avatar: AVATARS[63] },
  { idx: 65, name: 'Zainab Abbas', username: 'zainab.a', bio: 'editorial book designer & typography nerd. judging books exclusively by their kerning.', website: 'zainababbas.press', interests: ['book-design', 'typography', 'editorial', 'print'], avatar: AVATARS[64] },
];

// Build deterministic social graph (followers / following) across all 65 users
function buildUsers(passwordHash) {
  const followingMap = new Map();
  const followersMap = new Map();
  for (let i = 1; i <= RAW_USERS.length; i++) {
    followingMap.set(i, new Set());
    followersMap.set(i, new Set());
  }

  const addFollow = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx < 1 || toIdx < 1 || fromIdx > RAW_USERS.length || toIdx > RAW_USERS.length) return;
    followingMap.get(fromIdx).add(toIdx);
    followersMap.get(toIdx).add(fromIdx);
  };

  // User 1 (meera.k) follows 22 diverse creators so Following feed is super lively
  const meeraFollows = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 20, 21, 23, 25, 30, 32, 37, 42];
  meeraFollows.forEach((target) => addFollow(1, target));

  // Deterministic realistic connections for every user (each user follows 10-24 others)
  for (let i = 1; i <= RAW_USERS.length; i++) {
    const count = 10 + ((i * 7) % 15);
    for (let step = 1; step <= count; step++) {
      const target = ((i * 5 + step * 11) % RAW_USERS.length) + 1;
      addFollow(i, target);
    }
    // Also many users follow core creators 1..15
    if (i > 1) {
      addFollow(i, ((i % 8) + 1));
      if (i % 2 === 0) addFollow(i, 1);
      if (i % 3 === 0) addFollow(i, 3);
      if (i % 4 === 0) addFollow(i, 5);
    }
  }

  const baseJoin = new Date('2025-11-15T09:00:00Z').getTime();

  return RAW_USERS.map((u) => {
    const followingIds = Array.from(followingMap.get(u.idx)).map(userOid);
    const followerIds = Array.from(followersMap.get(u.idx)).map(userOid);
    const createdAt = new Date(baseJoin + u.idx * 86400000 * 1.5);

    return {
      _id: userOid(u.idx),
      name: u.name,
      username: u.username,
      email: `${u.username.replace(/[^a-z0-9]/g, '')}@vybe.social`,
      password: passwordHash,
      bio: u.bio.slice(0, 160),
      avatar: u.avatar,
      website: u.website,
      interests: u.interests,
      isDemo: true,
      followers: followerIds,
      following: followingIds,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

// 200 Distinct, Varied, Authentic Posts across the 65 Users
const RAW_POSTS = [
  // 1-8: Original signature posts preserved
  { u: 2, type: 'text', tags: ['engineering', 'architecture'], media: '', content: "If your team has fewer than 25 engineers and you're debugging network timeouts across 12 microservices instead of shipping, you didn't buy scalability—you bought operational overhead. A well-structured modular monolith is still the fastest way to learn and iterate." },
  { u: 3, type: 'image_single', tags: ['architecture', 'design'], media: MEDIA.arch1, content: "Morning light cutting across the Legislative Assembly portico in Chandigarh. The raw concrete holds 70 years of monsoons and still looks resolute. 📐🏛️ #architecture #design" },
  { u: 1, type: 'image_grid_2', tags: ['designsystems', 'ui'], mediaGrid: [MEDIA.ui1, MEDIA.ui2], content: "Audited our component library this week: removed 6 redundant button variants and consolidated text styles from 14 down to 7. A design system shouldn't be a catalog of everything you've ever built; it's a contract of what you're willing to maintain. 🎨 #designsystems" },
  { u: 5, type: 'poll', tags: ['ux', 'product'], media: '', content: "How does your team handle design-to-code handoffs when minor microcopy changes happen post-spec? 📊👇 #ux #product" },
  { u: 8, type: 'text', tags: ['engineering', 'database'], media: '', content: "Added a composite index on (tenant_id, created_at) yesterday. P99 latency dropped from 240ms to 18ms on our heaviest reporting queries. Sometimes you don't need a distributed cache—you just need the right index. #engineering #database" },
  { u: 4, type: 'image_single', tags: ['webgl', 'gamedev'], media: MEDIA.shader, content: "Wrote a custom GLSL fragment shader for soft edge-blur in WebGL today. Balancing frame time on integrated mobile GPUs without pre-baking static textures is a satisfying optimization puzzle 🎮✨ #webgl #gamedev" },
  { u: 7, type: 'text', tags: ['design', 'leadership'], media: '', content: "The most productive design reviews always start with the problem statement written in plain English, not the Figma canvas. When the context is clear, the critique becomes about intent rather than personal taste. #design #leadership" },
  { u: 6, type: 'text', tags: ['postgres', 'devops'], media: '', content: "A friendly reminder to test your database backup restorations, not just the backup cron job. An untested backup isn't a backup—it's an unverified assumption. 🐘 #postgres #devops" },

  // 9-40: Programming, Systems, & Developer Experience
  { u: 9, type: 'text', tags: ['rust', 'compilers'], media: '', content: "Spent the afternoon improving a diagnostic span in our parser. Good compiler errors do three things: show exactly where the syntax broke, explain why the rule exists in plain language, and offer a copy-pasteable fix. #rust #compilers" },
  { u: 10, type: 'image_single', tags: ['buildinpublic', 'localfirst'], media: MEDIA.laptop1, content: "Shipped offline sync conflict resolution in FinchNote v0.9 today! Using CRDTs for paragraph blocks and simple last-write-wins for frontmatter metadata kept the bundle under 42KB. #buildinpublic #localfirst" },
  { u: 12, type: 'text', tags: ['machinelearning', 'edgeai'], media: '', content: "Running a 3B parameter model quantized to 4-bit on a fanless MacBook Air at 38 tokens/sec still feels like magic. Most document summarization workflows don't need a massive cloud GPU cluster anymore. #machinelearning #edgeai" },
  { u: 14, type: 'image_single', tags: ['linux', 'opensource'], media: MEDIA.code1, content: "Finally got pty job control and SIGWINCH resize events working cleanly in my weekend terminal multiplexer project. Reading Stevens' Advanced Programming in the UNIX Environment alongside the actual kernel source is unbeaten. #linux #opensource" },
  { u: 16, type: 'text', tags: ['ios', 'swiftui'], media: '', content: "Subtle UI detail that matters: when a user flicks a bottom sheet downward, matching the initial deceleration curve to their exact finger velocity makes the sheet feel like a physical card rather than a timer-based CSS transition. #ios #swiftui" },
  { u: 18, type: 'image_single', tags: ['sre', 'observability'], media: MEDIA.server1, content: "Deleted 40 noisy Prometheus alerts this morning that hadn't triggered an actionable runbook step in six months. Alert fatigue is the #1 enemy of incident response. If an alert doesn't require human action right now, it belongs in a dashboard. #sre #observability" },
  { u: 20, type: 'text', tags: ['css', 'webstandards'], media: '', content: "Native CSS `:has()`, `color-mix()`, and `@starting-style` have quietly replaced almost 600 lines of JavaScript state wrappers in our codebase this quarter. The platform keeps getting stronger. #css #webstandards" },
  { u: 24, type: 'text', tags: ['civictech', 'maps'], media: '', content: "Mapped real-time GTFS bus arrivals across 1,400 stops tonight. Switching our tile layer to PMTiles hosted on object storage cut our monthly map hosting bill from $420 to $6.80. #civictech #maps" },
  { u: 26, type: 'text', tags: ['security', 'infosec'], media: '', content: "Quick security tip: rotating API secrets is useless if your application logs full request headers on 500 errors and ships them to a shared log aggregator. Always scrub `Authorization` and `Cookie` headers at the logger middleware level. #security #infosec" },
  { u: 28, type: 'text', tags: ['duckdb', 'data'], media: '', content: "Queried 18GB of Parquet files directly on my laptop using DuckDB in 4.2 seconds. For medium-sized analytical workloads, single-node columnar execution is ridiculously fast. #duckdb #data" },
  { u: 30, type: 'text', tags: ['docs', 'devex'], media: '', content: "Every README needs a 'Quickstart in 90 seconds' section with a working curl or CLI snippet before explaining the philosophical architecture of the library. Respect the reader's time first. #docs #devex" },
  { u: 33, type: 'image_single', tags: ['neovim', 'productivity'], media: MEDIA.desk1, content: "Trimmed my Neovim startup time down to 14ms by lazy-loading LSP keymaps on `LspAttach`. There's something deeply calming about an editor that opens faster than your eye can blink. #neovim #productivity" },
  { u: 35, type: 'text', tags: ['embedded', 'hardware'], media: '', content: "Found the culprit behind a random brownout on our sensor board: an SPI flash chip drawing a 45mA spike during sector erase right when the radio transmitted. One 10uF decoupling capacitor later, rock solid. #embedded #hardware" },
  { u: 37, type: 'image_single', tags: ['designengineering', 'motion'], media: MEDIA.abstract1, content: "Prototyping a keyboard-first command palette where the focus ring morphs smoothly between list items using layout projection. Fast enough for power users, tactile enough to feel crafted. #designengineering #motion" },
  { u: 41, type: 'text', tags: ['nodejs', 'performance'], media: '', content: "Captured a CPU flamegraph on our Node.js ingestion worker and discovered 34% of CPU time was spent inside `JSON.parse` on huge webhook payloads. Switched to streaming parsing for the 2 fields we actually need—throughput doubled. #nodejs #performance" },
  { u: 45, type: 'text', tags: ['distributed', 'testing'], media: '', content: "Deterministic simulation testing is the closest thing we have to a time machine for distributed systems. Being able to replay a network partition bug with a single 64-bit seed `--seed 9841204` saves weeks of guesswork. #distributed #testing" },
  { u: 49, type: 'text', tags: ['webperf', 'browsers'], media: '', content: "Fixed a subtle detached DOM tree memory leak in our SPA today: an IntersectionObserver callback was holding a closure over unmounted table rows. Always pair observer creation with explicit `.disconnect()` cleanup. #webperf #browsers" },
  { u: 51, type: 'text', tags: ['unix', 'debugging'], media: '', content: "Before installing a 500MB profiling suite, remember what `strace -f -e trace=network,file` and `lsof` can tell you in thirty seconds. Half of all 'mysterious hangs' are just DNS timeouts or locked files. #unix #debugging" },
  { u: 54, type: 'text', tags: ['fintech', 'backend'], media: '', content: "Never store monetary balances as IEEE 754 floats. Store integer minor units (paise/cents) alongside an explicit ISO-4217 currency code, and enforce double-entry ledger invariants in a single serializable transaction. #fintech #backend" },
  { u: 58, type: 'text', tags: ['typescript', 'vite'], media: '', content: "Released v1.4 of our open-source Vite SVG sprite plugin tonight. Watching community contributors open thoughtful PRs with repro cases is the best part of maintaining open source. #typescript #vite" },
  { u: 62, type: 'text', tags: ['cloud', 'infra'], media: '', content: "Moved three predictable batch-processing workers from on-demand cloud VMs to reserved bare-metal nodes. Monthly compute spend dropped 58% and P95 job completion time improved by 22%. #cloud #infra" },
  { u: 2, type: 'text', tags: ['architecture', 'backend'], media: '', content: "The best internal APIs have tiny surface areas. Three predictable methods with clear failure modes beat fifteen 'convenience' overloads that behave slightly differently under load. #architecture #backend" },
  { u: 6, type: 'text', tags: ['postgresql', 'sql'], media: '', content: "Postgres tip of the day: use `EXPLAIN (ANALYZE, BUFFERS)` instead of plain `EXPLAIN ANALYZE`. Seeing shared buffer hits vs disk reads tells you immediately why a query is slow in production. #postgresql #sql" },
  { u: 8, type: 'image_single', tags: ['indiedev', 'buildinpublic'], media: MEDIA.board1, content: "Friday changelog: shipped CSV export, dark mode contrast fixes, and keyboard shortcuts (`g` then `f` for feed). Small steady improvements compound faster than big rewrites. #indiedev #buildinpublic" },

  // 41-80: Design, Typography, Architecture, & Visual Craft
  { u: 1, type: 'text', tags: ['designsystems', 'tokens'], media: '', content: "When naming semantic color tokens, name them by role (`--bg-elevated`, `--border-subtle`, `--text-muted`) rather than hue (`--gray-200`). That single discipline makes dark mode a 100-line token swap instead of a 3-month refactor. #designsystems #tokens" },
  { u: 5, type: 'text', tags: ['uxwriting', 'microcopy'], media: '', content: "Error messages shouldn't blame the user. Instead of 'Invalid input format', write 'Enter a 6-digit verification code'. Clear microcopy reduces support tickets faster than any tooltip tutorial. #uxwriting #microcopy" },
  { u: 17, type: 'image_single', tags: ['typography', 'devanagari'], media: MEDIA.typo1, content: "Harmonizing stroke modulation between Devanagari matras and Latin ascenders at 14px body size. Screen hinting on non-Retina monitors still demands painstaking curve adjustments. #typography #devanagari" },
  { u: 21, type: 'image_single', tags: ['industrialdesign', 'hardware'], media: MEDIA.sketch1, content: "Morning marker sketches for a rotary detent encoder on a desktop timer. Touchscreens are versatile, but nothing replaces the eyes-free certainty of a physical click. #industrialdesign #hardware" },
  { u: 23, type: 'image_single', tags: ['illustration', 'risograph'], media: MEDIA.art1, content: "Fresh off the Risograph drum: 120 copies of our two-color botanical zine printed in Soy Black and Fluorescent Coral on 120gsm uncoated Munken paper. Love the slight registration offset. #illustration #risograph" },
  { u: 25, type: 'text', tags: ['uxdesign', 'healthtech'], media: '', content: "Shadowed ER triage nurses for four hours yesterday. Watched them use our patient intake screen under fluorescent glare while standing up. Immediately increased our primary tap targets from 36px to 48px and boosted contrast ratios. #uxdesign #healthtech" },
  { u: 29, type: 'image_single', tags: ['urbanism', 'architecture'], media: MEDIA.minimal1, content: "Walkable neighborhoods aren't an accident—they're the result of narrow street widths, continuous shade canopies, and ground-floor storefronts every 8 meters. Sketching street sections in Pune today. #urbanism #architecture" },
  { u: 34, type: 'text', tags: ['edtech', 'interaction'], media: '', content: "When kids can drag a geometric vertex and watch the area equation update in real time, fractions stop feeling like abstract rules and start feeling like spatial intuition. #edtech #interaction" },
  { u: 44, type: 'text', tags: ['uxresearch', 'product'], media: '', content: "Five 30-minute usability sessions where you stay quiet and watch someone struggle to find the 'Save' button will teach your team more than a 40-slide survey deck ever could. #uxresearch #product" },
  { u: 46, type: 'image_single', tags: ['generativeart', 'plotter'], media: MEDIA.ui1, content: "Plotted a 4,000-line flow field tonight using a 0.3mm Rotring technical pen on Bristol board. When the pen nib catches the paper grain, the algorithm gains a physical texture pixels can't replicate. #generativeart #plotter" },
  { u: 52, type: 'text', tags: ['packaging', 'craft'], media: '', content: "Switched a client's coffee box from laminated plastic film to unbleached cotton-rag cardstock with blind debossing. Costs 4% more per unit, 100% recyclable, and feels extraordinary in the hand. #packaging #craft" },
  { u: 55, type: 'image_single', tags: ['architecture', 'sustainability'], media: MEDIA.arch1, content: "Measured indoor temperatures at our terracotta-louvred courtyard house in Kochi today: 26.5°C inside while it's 34°C outside, with zero air conditioning. Passive cross-ventilation works. #architecture #sustainability" },
  { u: 61, type: 'text', tags: ['designeducation', 'ui'], media: '', content: "If a screen feels 'cluttered', 90% of the time the fix isn't deleting features—it's reducing the number of distinct font sizes, aligning left edges to a strict grid, and doubling the whitespace between groups. #designeducation #ui" },
  { u: 65, type: 'image_single', tags: ['bookdesign', 'editorial'], media: MEDIA.books1, content: "Typesetting a 320-page essay collection in Garamond Premier. Adjusted paragraph rag and widow lines by hand across 18 chapters. Good book design should feel completely invisible to the reader. #bookdesign #editorial" },
  { u: 1, type: 'text', tags: ['typography', 'css'], media: '', content: "Setting `font-variant-numeric: tabular-nums` on counters, timestamps, and tables prevents layout jitter when numbers update live. Tiny CSS property, huge polish upgrade. #typography #css" },
  { u: 7, type: 'image_single', tags: ['studio', 'creativity'], media: MEDIA.studio1, content: "Our Friday studio ritual at CraftLab: 45 minutes of 'Show & Tell' where everyone shares one unfinished experiment or reference they found inspiring this week. No slide decks allowed. #studio #creativity" },

  // 81-120: Photography, Visual Arts, Music, & Film
  { u: 3, type: 'image_single', tags: ['photography', 'brutalism'], media: MEDIA.minimal1, content: "Concrete waffle slabs at the Indian Institute of Management in Ahmedabad. Louis Kahn understood that shadow is an architectural material just as permanent as brick. #photography #brutalism" },
  { u: 11, type: 'image_single', tags: ['streetphotography', '35mm'], media: MEDIA.street1, content: "Developed two rolls of Kodak Tri-X 400 shot at Marine Drive right before the first pre-monsoon downpour. The grain in the sea spray looks like charcoal dust. #streetphotography #35mm" },
  { u: 22, type: 'image_single', tags: ['synth', 'gamedev'], media: MEDIA.synth1, content: "Recorded the rain ambience and tape-loop piano motifs for level 3 of an indie puzzle game today. Running digital stems through an old cassette deck adds instant warmth. #synth #gamedev" },
  { u: 32, type: 'image_single', tags: ['photography', 'nature'], media: MEDIA.nature1, content: "Early mist lifting over the coffee estates in Coorg at 6:10 AM. Waited forty minutes for a single shaft of sunlight to hit the silver oaks. #photography #nature" },
  { u: 39, type: 'text', tags: ['gamedev', 'indie'], media: '', content: "Playtested our train-station puzzle game with 12 strangers today. Watching someone smile when they figure out a mechanic without any text tutorial makes six months of level iteration worth it. #gamedev #indie" },
  { u: 43, type: 'image_single', tags: ['travel', 'mountains'], media: MEDIA.shader, content: "Chai at 13,400 feet near Kunzum Pass. Cold wind, prayer flags snapping in the distance, and the warmest brass kettle in Spiti. #travel #mountains" },
  { u: 48, type: 'text', tags: ['music', 'dsp'], media: '', content: "Modeled the sympathetic string resonance of a tanpura using waveguide synthesis in C++ today. Capturing that shimmering harmonic overtone curve in 48kHz real-time audio is fascinating. #music #dsp" },
  { u: 60, type: 'image_single', tags: ['astrophotography', 'space'], media: MEDIA.camera1, content: "Four hours of 180-second tracked exposures under Bortle 1 skies in Hanle. Even on the back of the camera LCD, the dust lanes in the Milky Way core are razor sharp. #astrophotography #space" },
  { u: 63, type: 'text', tags: ['filmmaking', 'storytelling'], media: '', content: "Spent three days in Kutch interviewing an 82-year-old Ajrakh block printer. His hands remember geometric ratios that have been passed down for nine generations without a single blueprint. #filmmaking #storytelling" },
  { u: 11, type: 'text', tags: ['photography', 'craft'], media: '', content: "The best camera to carry is the one small enough that you don't leave it at home. A fixed 35mm prime lens teaches you to move your feet and compose with intention. #photography #craft" },
  { u: 32, type: 'image_single', tags: ['botanical', 'minimal'], media: MEDIA.plant1, content: "Monstera shadow study against lime-washed plaster in the studio this afternoon. Simple light, quiet frame. #botanical #minimal" },
  { u: 4, type: 'text', tags: ['creativecoding', 'shaders'], media: '', content: "Simulating watercolor pigment dispersion on a 2D heightfield grid. Adding a tiny Perlin noise perturbation to the capillary flow edge makes the drying ring look remarkably organic. #creativecoding #shaders" },

  // 121-160: Startups, Career Growth, Books, & Productivity
  { u: 10, type: 'text', tags: ['startups', 'bootstrapping'], media: '', content: "Crossed 400 paying customers on FinchNote today! Zero venture capital, zero paid ads—just shipping weekly improvements and answering every support email personally within two hours. #startups #bootstrapping" },
  { u: 13, type: 'image_single', tags: ['career', 'writing'], media: MEDIA.notebook1, content: "Career advice I wish I heard at 23: don't optimize only for the prestige of the company logo. Optimize for the slope of your learning curve and the kindness of the people reviewing your work every day. #career #writing" },
  { u: 15, type: 'image_single', tags: ['books', 'reading'], media: MEDIA.books1, content: "Finished Ursula K. Le Guin's 'The Dispossessed' for the third time. Few writers can build an entire political and linguistic philosophy inside a deeply human story without a single wasted page. #books #reading" },
  { u: 27, type: 'text', tags: ['smallbusiness', 'craft'], media: '', content: "Unloaded Kiln Batch #42 this morning: 68 stoneware pour-over drippers in speckled oatmeal glaze. Packing orders with handwritten thank-you notes never gets old. #smallbusiness #craft" },
  { u: 31, type: 'text', tags: ['founders', 'b2b'], media: '', content: "Founder lesson from 30 customer discovery calls this month: never ask 'Would you use a tool that does X?' Everyone says yes to be polite. Ask 'Show me how you solved this problem last Tuesday.' #founders #b2b" },
  { u: 36, type: 'text', tags: ['history', 'technology'], media: '', content: "Reading 1870s telegraph operator journals in the archives today. They had their own shorthand slang, latency complaints, and packet-loss retries—150 years before Slack. Human nature doesn't change. #history #technology" },
  { u: 38, type: 'text', tags: ['leadership', 'remotework'], media: '', content: "Replaced our daily 9:30 AM status standup with a crisp async written thread and one deep-dive architecture session on Wednesdays. Deep work blocks went up, meeting fatigue vanished. #leadership #remotework" },
  { u: 40, type: 'text', tags: ['branding', 'copywriting'], media: '', content: "If you can swap your startup's homepage headline with three of your competitors and it still makes sense, it's not positioning—it's filler. Say specifically who it's for and what it replaces. #branding #copywriting" },
  { u: 42, type: 'image_single', tags: ['books', 'bookshop'], media: MEDIA.coffee1, content: "Rainy Sunday afternoon at the bookshop. Twelve people reading quietly in the corner armchairs while the espresso machine hums. Independent third places matter so much. #books #bookshop" },
  { u: 47, type: 'text', tags: ['indiehackers', 'saas'], media: '', content: "My favorite SaaS metric isn't signups—it's 90-day retention. Solving an unglamorous recurring workflow (like automated GST invoice reconciliation) beats flashy novelty every single time. #indiehackers #saas" },
  { u: 53, type: 'text', tags: ['student', 'buildinpublic'], media: '', content: "Demoed my capstone project to the department panel today and got an A! Even better: three juniors asked for the GitHub repo so they can use it for lab scheduling next semester. #student #buildinpublic" },
  { u: 56, type: 'text', tags: ['dataviz', 'storytelling'], media: '', content: "When designing charts for a general audience, put the key takeaway directly in the chart title ('Solar generation passed coal in Q2') and label lines directly instead of forcing eyes to bounce to a legend. #dataviz #storytelling" },
  { u: 57, type: 'text', tags: ['copywriting', 'devtools'], media: '', content: "Developer marketing rule #1: show the actual code or UI in the first scroll. Engineers don't want 'synergistic cloud paradigms'—they want to see the 6-line SDK call and the pricing table. #copywriting #devtools" },
  { u: 59, type: 'text', tags: ['productivity', 'pkm'], media: '', content: "Your note-taking system should serve your thinking, not become a second job. Three folders—Inbox, Active Projects, Archive—and plain markdown search is enough for 95% of life. #productivity #pkm" },

  // 161-200: Everyday Experiences, Tech Discussions, & Community Reflections (total = 200 posts!)
  { u: 19, type: 'text', tags: ['academia', 'python'], media: '', content: "Refactored a 900-line Jupyter notebook into a clean Python package with `pytest` fixtures today. Future me writing the thesis methods chapter in six months is going to be so grateful. #academia #python" },
  { u: 50, type: 'text', tags: ['climatetech', 'energy'], media: '', content: "Grid-scale battery storage costs have fallen 40% in the last two years. Pairing afternoon solar surpluses with 4-hour evening discharge is transforming regional load curves faster than forecast. #climatetech #energy" },
  { u: 64, type: 'text', tags: ['analytics', 'python'], media: '', content: "Plotted javelin release angle vs wind-adjusted carry distance across 400 throws in matplotlib. A 1.8-degree variance at release matters more than raw approach sprint speed. #analytics #python" },
  { u: 1, type: 'image_single', tags: ['kyoto', 'inspiration'], media: MEDIA.kyoto1, content: "Looking back at my sketchbook notes from Kyoto: how cedar joinery transitions from street to threshold to garden. Digital onboarding flows could learn so much from spatial pacing. #kyoto #inspiration" },
  { u: 2, type: 'text', tags: ['golang', 'engineering'], media: '', content: "One reason I still enjoy writing Go for backend services: reading code written by a teammate three years ago feels identical to reading code written yesterday. Boring readability scales across teams. #golang #engineering" },
  { u: 3, type: 'text', tags: ['photography', 'archiving'], media: '', content: "Backed up 14,000 RAW negatives across two local NAS drives and an offsite cold-storage bucket tonight. Digital photographers: follow the 3-2-1 backup rule before a hard drive clicks! #photography #archiving" },
  { u: 4, type: 'text', tags: ['gamedev', 'audio'], media: '', content: "Added subtle pitch variation (±4%) to footstep sound effects on gravel and wood surfaces. Amazing how a 3-line tweak stops repetitive audio from sounding robotic. #gamedev #audio" },
  { u: 5, type: 'text', tags: ['accessibility', 'a11y'], media: '', content: "Tested our checkout modal with VoiceOver and keyboard-only navigation today. Found two icon buttons missing `aria-label` and a focus trap issue on Escape. Accessibility testing should be part of every PR checklist. #accessibility #a11y" },
  { u: 6, type: 'text', tags: ['databases', 'migrations'], media: '', content: "Zero-downtime schema migration rule: never rename a column in place while old app instances are running. Add the new column, dual-write, backfill in batches, switch reads, then drop the old column. #databases #migrations" },
  { u: 7, type: 'text', tags: ['culture', 'creativity'], media: '', content: "Protect your mornings from reactive notifications. Even 60 minutes of uninterrupted making before opening email changes the posture of your entire day. #culture #creativity" },
  { u: 8, type: 'text', tags: ['saas', 'pricing'], media: '', content: "Simplified our pricing page from 4 tiers with 28 feature checkboxes down to 2 clear plans. Conversion rate went up 19% in the first week. Confusion is the silent killer of checkout flows. #saas #pricing" },
  { u: 9, type: 'text', tags: ['opensource', 'rust'], media: '', content: "Merged a first-time contributor's PR today! Leaving `good first issue` tickets with clear file pointers and test instructions is the best investment a maintainer can make. #opensource #rust" },
  { u: 10, type: 'text', tags: ['markdown', 'writing'], media: '', content: "Plain text files from 1998 still open instantaneously in 2026. Building software on open, human-readable file formats is the ultimate form of user respect. #markdown #writing" },
  { u: 11, type: 'text', tags: ['mumbai', 'monsoon'], media: '', content: "First proper evening rain in Mumbai. The smell of wet earth on hot asphalt and cutting chai at the corner stall—nothing quite like it. 🌧️☕ #mumbai #monsoon" },
  { u: 12, type: 'text', tags: ['ai', 'engineering'], media: '', content: "The hardest part of production LLM features isn't the prompt—it's building deterministic evaluation harnesses so you know immediately when a change regresses edge cases. #ai #engineering" },
  { u: 13, type: 'text', tags: ['writing', 'habits'], media: '', content: "Published essay #50 of my weekly newsletter today! Writing 1,000 words every Sunday for a year taught me more about clarifying my own thoughts than a decade of passive reading. #writing #habits" },
  { u: 14, type: 'text', tags: ['cprogramming', 'systems'], media: '', content: "Implemented a custom arena allocator in 85 lines of C today. Freeing an entire parse tree in O(1) by resetting a single pointer offset feels illegal after years of garbage collection. #cprogramming #systems" },
  { u: 15, type: 'text', tags: ['books', 'scifi'], media: '', content: "Weekend reading stack: Ted Chiang's 'Exhalation' and Calvino's 'Invisible Cities'. Short stories that respect your imagination and linger for weeks. 📚 #books #scifi" },
  { u: 16, type: 'image_single', tags: ['mobile', 'ui'], media: MEDIA.ui2, content: "Refining thumb-zone ergonomics on our bottom navigation sheet. Moving the primary filter pill 16px lower made one-handed browsing effortless on large screens. #mobile #ui" },
  { u: 17, type: 'text', tags: ['typography', 'print'], media: '', content: "Visited a 90-year-old letterpress shop in Old Delhi today. Holding cast lead type sorts in a composing stick makes you appreciate why CSS calls line-height 'leading'. #typography #print" },
  { u: 18, type: 'text', tags: ['devops', 'postmortem'], media: '', content: "Blameless postmortems only work when leadership models curiosity instead of finger-pointing. Ask 'What allowed the system to accept that bad config?' rather than 'Who ran the command?' #devops #postmortem" },
  { u: 19, type: 'image_single', tags: ['coffee', 'research'], media: MEDIA.coffee1, content: "South Indian filter coffee in a brass davara before running a 6-hour sequence alignment job. Science runs on caffeine and patience. ☕🧬 #coffee #research" },
  { u: 20, type: 'text', tags: ['javascript', 'clean'], media: '', content: "Deleted three state-management dependencies from a client project and replaced them with URL query parameters and native form events. Now every filter view is shareable and bookmarkable for free. #javascript #clean" },
  { u: 21, type: 'text', tags: ['eink', 'minimalism'], media: '', content: "Been testing an e-ink monitor for long coding and reading sessions. Zero backlight flicker under a warm desk lamp feels just like paper. #eink #minimalism" },
  { u: 22, type: 'text', tags: ['audio', 'creativity'], media: '', content: "Carried a pocket field recorder through the botanical garden this morning. Wind in bamboo leaves + distant temple bells = the foundation for tonight's ambient track. #audio #creativity" },
  { u: 23, type: 'text', tags: ['sketchbook', 'art'], media: '', content: "Keep an 'ugly sketchbook' that you never show anyone on social media. Creative freedom requires a place where you're allowed to make bad drawings without an audience. #sketchbook #art" },
  { u: 24, type: 'text', tags: ['typescript', 'apis'], media: '', content: "Generating end-to-end TypeScript types directly from our OpenAPI schema caught 4 mismatched payload fields before staging deploy today. Contract-first APIs pay off fast. #typescript #apis" },
  { u: 25, type: 'text', tags: ['prototyping', 'design'], media: '', content: "Before spending three days building a high-fidelity interactive component, sketch three radically different approaches on paper in 15 minutes. Breadth first, depth second. #prototyping #design" },
  { u: 26, type: 'text', tags: ['cryptography', 'security'], media: '', content: "Passkeys (WebAuthn) are finally hitting mainstream adoption. Phishing-resistant public-key cryptography baked into device secure enclaves is a massive win for everyday users. #cryptography #security" },
  { u: 27, type: 'image_single', tags: ['ceramics', 'studio'], media: MEDIA.studio1, content: "Afternoon light in the pottery studio while trimming mug foot-rings. Slow craft teaches you that rushing a drying stage always shows up in the firing. #ceramics #studio" },
  { u: 28, type: 'text', tags: ['sql', 'analytics'], media: '', content: "A well-written SQL CTE with clear comments is 10x easier to debug than a tangled chain of ORM methods spread across five service files. Embrace SQL. #sql #analytics" },
  { u: 29, type: 'text', tags: ['cities', 'transit'], media: '', content: "Dedicated bus lanes are the highest-ROI infrastructure upgrade any growing city can paint in a single month. Moving 60 people per vehicle beats single-occupancy gridlock every time. #cities #transit" },
  { u: 30, type: 'text', tags: ['writing', 'clarity'], media: '', content: "Editing rule: cut every instance of 'in order to' down to 'to', 'utilize' down to 'use', and 'at this point in time' down to 'now'. Clear writing is compressed thinking. #writing #clarity" },
  { u: 31, type: 'text', tags: ['startups', 'product'], media: '', content: "Our most requested enterprise feature took 45 lines of code to build: an audit log table showing who changed which setting and when. Simple trust features close deals. #startups #product" },
  { u: 32, type: 'text', tags: ['mediumformat', 'film'], media: '', content: "Looking through a waist-level viewfinder on a 6x6 medium format camera changes how people react to having their portrait taken—you're bowing your head instead of hiding behind a lens. #mediumformat #film" },
  { u: 33, type: 'text', tags: ['cli', 'zig'], media: '', content: "Cross-compiling a static CLI binary for Linux, macOS, and Windows with a single `zig build` command without wrestling toolchains still feels like the future of systems tooling. #cli #zig" },
  { u: 34, type: 'text', tags: ['svg', 'webdev'], media: '', content: "Hand-coded SVG diagrams with CSS variables automatically adapt to light and dark themes, stay crisp at 400% zoom, and weigh 3KB instead of a 400KB PNG screenshot. #svg #webdev" },
  { u: 35, type: 'image_single', tags: ['electronics', 'hardware'], media: MEDIA.desk1, content: "New custom 4-layer PCB arrived from the fab today! Nothing beats the relief when you plug in USB-C power for the first time and the 3.3V rail LED glows green without magic smoke. #electronics #hardware" },
  { u: 36, type: 'text', tags: ['books', 'archives'], media: '', content: "Found a 1924 handwritten margin note in a university library book today where a student politely disagreed with the author's calculus proof—and the student was right! #books #archives" },
  { u: 37, type: 'text', tags: ['css', 'animation'], media: '', content: "Always wrap decorative motion in `@media (prefers-reduced-motion: no-preference)`. Great interaction design feels snappy for everyone and respects vestibular comfort. #css #animation" },
  { u: 38, type: 'text', tags: ['mentorship', 'career'], media: '', content: "When reviewing a junior engineer's pull request, don't just point out what to change—also leave a comment on a function they structured really well. Positive reinforcement builds confidence. #mentorship #career" },
  { u: 39, type: 'text', tags: ['pixelart', 'gamedev'], media: '', content: "Animated a 16x16 lantern swinging in the wind on a rainy platform. Restricting yourself to a 12-color palette forces every single pixel to carry weight. #pixelart #gamedev" },
  { u: 40, type: 'text', tags: ['strategy', 'naming'], media: '', content: "The best product names are easy to spell over a noisy phone call, have a clear rhythm, and evoke a feeling rather than describing a database table. #strategy #naming" },
  { u: 41, type: 'text', tags: ['opensource', 'javascript'], media: '', content: "Zero-dependency packages are underrated. Every transitive dependency you avoid is a supply-chain audit and a breaking semver bump you never have to debug at 2 AM. #opensource #javascript" },
  { u: 42, type: 'text', tags: ['reading', 'translation'], media: '', content: "Shoutout to literary translators—the unsung architects who carry rhythm, humor, and cultural nuance across languages so we can read the world. #reading #translation" },
  { u: 43, type: 'image_single', tags: ['photography', 'light'], media: MEDIA.nature1, content: "Golden hour in Zanskar Valley. When the sun drops behind the ridge, the limestone cliffs turn from ochre to deep violet in less than four minutes. #photography #light" },
  { u: 44, type: 'text', tags: ['psychology', 'ux'], media: '', content: "Hick's Law in practice: reducing our onboarding wizard from 9 optional preferences down to 2 essential choices increased completion rate from 54% to 88%. #psychology #ux" },
  { u: 45, type: 'text', tags: ['rust', 'storage'], media: '', content: "Implemented CRC32 checksum verification on every WAL segment read in our storage engine. Disks flip bits silently more often than people think; fail fast and loud on corruption. #rust #storage" },
  { u: 46, type: 'text', tags: ['creativecoding', 'math'], media: '', content: "Lissajous curves + damped harmonic oscillators = endless geometric calm. Math is the most generous design tool ever invented. #creativecoding #math" },
  { u: 47, type: 'text', tags: ['bootstrapping', 'focus'], media: '', content: "Saying 'no' to a custom feature request that doesn't fit the product vision is hard in the moment, but it's the only way to keep a solo codebase maintainable for years. #bootstrapping #focus" },
  { u: 48, type: 'text', tags: ['carnatic', 'music'], media: '', content: "Practiced raga Kalyani for two hours this morning before opening my laptop. Acoustic instruments demand full presence—if your mind wanders, your intonation tells you immediately. #carnatic #music" },
  { u: 49, type: 'text', tags: ['browsers', 'dom'], media: '', content: "Batching DOM reads before DOM writes prevented 14 forced synchronous layouts during scroll on our feed view. 60fps scrolling on budget Android devices is non-negotiable. #browsers #dom" },
  { u: 50, type: 'text', tags: ['data', 'climate'], media: '', content: "Open datasets are accelerators for climate research. Published our cleaned hourly solar irradiance CSVs for 40 Indian cities on GitHub today—free for any student or researcher to use. #data #climate" },
  { u: 51, type: 'text', tags: ['networking', 'tcp'], media: '', content: "Whenever someone says 'the network is reliable', I show them a Wireshark capture of a mobile connection switching from Wi-Fi to 5G inside an elevator. Always set explicit socket timeouts. #networking #tcp" },
  { u: 52, type: 'image_single', tags: ['print', 'design'], media: MEDIA.typo1, content: "Testing Pantone warm grays and blind embossing depths on 350gsm cotton board. Tactile print design slows the eye down in the best way. #print #design" },
  { u: 53, type: 'image_single', tags: ['hackathon', 'webdev'], media: MEDIA.laptop1, content: "36 hours, 4 teammates, way too much cold brew, and a working prototype that converts lecture audio into timestamped study flashcards! Best weekend of the semester. #hackathon #webdev" },
  { u: 54, type: 'text', tags: ['payments', 'idempotency'], media: '', content: "Idempotency keys are the unsung heroes of payment APIs. Whether a client retries a POST request once or ten times during a flaky connection, the customer is charged exactly once. #payments #idempotency" },
  { u: 55, type: 'text', tags: ['interiors', 'daylight'], media: '', content: "North-facing clerestory windows give studios soft, shadowless daylight from 8 AM to 5 PM without solar heat gain. Orientation is free energy. #interiors #daylight" },
  { u: 56, type: 'text', tags: ['economics', 'education'], media: '', content: "Broken y-axes on bar charts should be illegal. Visual honesty is the foundation of data journalism. #economics #education" },
  { u: 57, type: 'text', tags: ['content', 'writing'], media: '', content: "The best technical blog posts start with a real bug you hit in production, show the failed hypotheses, and end with the root cause. Authenticity beats generic tutorials every time. #content #writing" },
  { u: 58, type: 'text', tags: ['tooling', 'dx'], media: '', content: "Cut our monorepo CI pipeline from 14 minutes down to 2m 40s by caching build artifacts by content hash and running affected package tests only. Fast CI keeps developers in flow. #tooling #dx" },
  { u: 59, type: 'image_single', tags: ['minimalism', 'desk'], media: MEDIA.notebook1, content: "Sunday desk reset: one notebook, one fountain pen, a clean keyboard, and a cup of Darjeeling first flush. Clear space, clear head. #minimalism #desk" },
  { u: 60, type: 'text', tags: ['optics', 'space'], media: '', content: "Collimated my Newtonian reflector telescope tonight and caught Saturn's Cassini Division crystal clear through a 6mm eyepiece. Seeing photons that traveled for 80 minutes never gets old. #optics #space" },
  { u: 61, type: 'text', tags: ['workshops', 'design'], media: '', content: "Ran a 2-hour typography & spacing workshop for 35 backend engineers today. Their before-and-after dashboard redesigns were genuinely awesome! #workshops #design" },
  { u: 62, type: 'text', tags: ['terraform', 'devops'], media: '', content: "If a manual change in the cloud console isn't in your Terraform state within an hour, it's a future incident waiting for the next deploy. Infrastructure as code is peace of mind. #terraform #devops" },
  { u: 63, type: 'text', tags: ['cinema', 'editing'], media: '', content: "Film editing happens in the eyes of the subject. Hold a shot two seconds longer than feels comfortable, and the audience leans in to feel the weight of the room. #cinema #editing" },
  { u: 64, type: 'text', tags: ['fitness', 'recovery'], media: '', content: "Data from 6 months of training logs: 8 hours of consistent sleep improves next-day power output more than any supplement or recovery gadget on the market. #fitness #recovery" },
  { u: 65, type: 'text', tags: ['typography', 'kerning'], media: '', content: "Once you learn to spot bad kerning between 'W', 'A', and 'V' on street signage, you can never unsee it. Forgive us typographers, we mean well! 😅 #typography #kerning" },

  // Second wave of varied community posts (125..200) so every creator has multiple posts and rich discussions
  { u: 1, type: 'text', tags: ['vybe', 'community'], media: '', content: "Loving the mix of engineers, photographers, writers, and designers sharing real work-in-progress notes here on VYBE. Feels like the early web again—curious, helpful, and human. ✨ #vybe #community" },
  { u: 2, type: 'image_single', tags: ['systems', 'architecture'], media: MEDIA.server1, content: "Whiteboarding our event-sourcing snapshot strategy before writing a single line of code. Two hours at the whiteboard saves two weeks of migration pain. #systems #architecture" },
  { u: 3, type: 'image_single', tags: ['architecture', 'shadow'], media: MEDIA.arch1, content: "Stepwells of Gujarat: centuries-old subterranean architecture that turns descent into water into a geometric symphony of shadow and cool air. #architecture #shadow" },
  { u: 4, type: 'image_single', tags: ['shaders', 'art'], media: MEDIA.abstract1, content: "Raymarching signed distance fields (SDFs) with smooth boolean unions in 60 lines of GLSL. No meshes, no polygons—just pure implicit math. #shaders #art" },
  { u: 5, type: 'text', tags: ['designsystems', 'figma'], media: '', content: "Documenting 'When NOT to use this component' in our design system docs cut design review questions in half. Constraints create clarity. #designsystems #figma" },
  { u: 6, type: 'text', tags: ['sql', 'postgres'], media: '', content: "Partial indexes (`CREATE INDEX ... WHERE status = 'pending'`) shrunk our queue index from 4.2GB down to 18MB and made worker polling instantaneous. #sql #postgres" },
  { u: 7, type: 'text', tags: ['leadership', 'craft'], media: '', content: "High standards don't require harshness. You can be deeply rigorous about craft while being completely kind to the person learning it. #leadership #craft" },
  { u: 8, type: 'text', tags: ['indiedev', 'shipping'], media: '', content: "Shipped a tiny feature today that a customer asked for at 10 AM by 2 PM. Being small and nimble is the unfair advantage of independent software. #indiedev #shipping" },
  { u: 9, type: 'text', tags: ['rust', 'memory'], media: '', content: "Zero-copy deserialization with lifetimes in Rust feels tricky the first three times you write it, and then suddenly you realize you just parsed a 50MB file with zero heap allocations. #rust #memory" },
  { u: 10, type: 'text', tags: ['localfirst', 'sync'], media: '', content: "When an app opens in 30 milliseconds because your data lives in IndexedDB/SQLite on your own device instead of behind a loading spinner, you never want to go back to cloud-only tools. #localfirst #sync" },
  { u: 11, type: 'image_single', tags: ['streetphotography', 'blackandwhite'], media: MEDIA.street1, content: "Shadows at Victoria Terminus at 7:45 AM. Every commuter moving in rhythm while a single pigeon stands completely still in a sunbeam. #streetphotography #blackandwhite" },
  { u: 12, type: 'text', tags: ['python', 'ml'], media: '', content: "Cleaned 40,000 noisy training samples this week and improved F1 score by 9 points without touching the model architecture at all. Data quality > model complexity. #python #ml" },
  { u: 13, type: 'text', tags: ['career', 'mentorship'], media: '', content: "Keep a private 'brag document' where you jot down projects shipped, metrics moved, and teammates helped every Friday. Come performance review season, you'll have facts instead of fuzzy memories. #career #mentorship" },
  { u: 14, type: 'text', tags: ['linux', 'shell'], media: '', content: "Learned about `git bisect run` today—pointed it at a 5-line test script and it automatically found the exact commit that broke our build across 180 commits in 20 seconds! #linux #shell" },
  { u: 15, type: 'text', tags: ['books', 'notes'], media: '', content: "Why I still read physical paperbacks with a pencil in hand: flipping back to a page years later and seeing what 22-year-old you underlined is a conversation across time. #books #notes" },
  { u: 16, type: 'text', tags: ['swiftui', 'ios'], media: '', content: "Tested Dynamic Type scaling up to Accessibility XXXL on all our screens today. Layouts that adapt gracefully to large text help everyone—including tired eyes at night. #swiftui #ios" },
  { u: 17, type: 'text', tags: ['devanagari', 'type'], media: '', content: "Designing numerals that sit harmoniously in both Hindi and English tabular layouts requires careful x-height and cap-height calibration. #devanagari #type" },
  { u: 18, type: 'text', tags: ['kubernetes', 'sre'], media: '', content: "Set sensible CPU requests and memory limits on every pod, and test graceful SIGTERM shutdown handlers so rolling deploys drop zero in-flight HTTP requests. #kubernetes #sre" },
  { u: 19, type: 'text', tags: ['dataviz', 'science'], media: '', content: "Switched all our lab paper figures to colorblind-safe Viridis and Okabe-Ito palettes. Scientific communication should be legible to every reader. #dataviz #science" },
  { u: 20, type: 'image_single', tags: ['webstandards', 'html'], media: MEDIA.code1, content: "Semantic HTML appreciation post: `<dialog>`, `<details>`, and `<datalist>` give you keyboard focus management, Escape-key closing, and screen-reader announcements right out of the box. #webstandards #html" },
  { u: 21, type: 'text', tags: ['hardware', 'repair'], media: '', content: "Designed our enclosure with standard Torx T6 screws instead of ultrasonic glue so anyone can swap the battery in three minutes with a screwdriver. Right to repair starts at the CAD desk. #hardware #repair" },
  { u: 22, type: 'text', tags: ['sounddesign', 'games'], media: '', content: "Good UI sound design should feel like soft wood and brushed felt—never harsh high-frequency beeps. Low-pass filters are your best friend. #sounddesign #games" },
  { u: 23, type: 'image_single', tags: ['printmaking', 'illustration'], media: MEDIA.art1, content: "Carving linocut blocks for a series of nocturnal city postcards. The resistance of the linoleum forces bold, decisive lines. #printmaking #illustration" },
  { u: 24, type: 'text', tags: ['maps', 'opensource'], media: '', content: "OpenStreetMap contributors are incredible. Someone mapped every single cycle rack and drinking fountain in our city district down to 1-meter accuracy. #maps #opensource" },
  { u: 25, type: 'text', tags: ['research', 'ux'], media: '', content: "When users build a spreadsheet workaround alongside your software, don't get defensive—study that spreadsheet! It's a free blueprint of the exact workflow your product is missing. #research #ux" },
  { u: 26, type: 'text', tags: ['infosec', 'linux'], media: '', content: "Hardened our SSH bastion with short-lived Ed25519 certificates instead of static `authorized_keys` files. Zero lingering credentials when someone rotates off a project. #infosec #linux" },
  { u: 27, type: 'text', tags: ['entrepreneurship', 'craft'], media: '', content: "Three years of running an independent ceramics studio taught me that pricing sustainably isn't greed—it's what allows you to keep making careful work five years from now. #entrepreneurship #craft" },
  { u: 28, type: 'text', tags: ['dataengineering', 'pipelines'], media: '', content: "Idempotent data pipelines are life savers. If re-running yesterday's partition duplicates rows in your warehouse, fix the upsert boundary before adding any new dashboards. #dataengineering #pipelines" },
  { u: 29, type: 'text', tags: ['sketching', 'architecture'], media: '', content: "Drawing a building by hand for 20 minutes forces you to notice how the roof overhang protects the brickwork from rain—details a 1-second phone photo skips right past. #sketching #architecture" },
  { u: 30, type: 'text', tags: ['apis', 'documentation'], media: '', content: "Include real, realistic values in API documentation examples (`\"amount_paise\": 49900`, `\"currency\": \"INR\"`) instead of `\"string\"` and `123`. Developers learn by pattern-matching examples. #apis #documentation" },
  { u: 31, type: 'text', tags: ['growth', 'startups'], media: '', content: "Our highest-converting acquisition channel isn't cold outbound—it's a free, no-signup interactive calculator we built that solves a real 5-minute problem for operations leads. #growth #startups" },
  { u: 32, type: 'image_single', tags: ['portraits', 'photography'], media: MEDIA.camera1, content: "Natural window light + a simple white linen reflector is 90% of portrait photography. You don't need a studio full of strobes to capture warmth. #portraits #photography" },
  { u: 33, type: 'text', tags: ['productivity', 'terminal'], media: '', content: "Wrote a 12-line shell function `fbr` using `fzf` to fuzzy-search and checkout recent git branches sorted by commit date. Saves me 20 seconds a dozen times a day. #productivity #terminal" },
  { u: 34, type: 'text', tags: ['learning', 'edtech'], media: '', content: "The best educational interfaces never punish a wrong answer with a loud red buzz. They show visually what the input produced so the learner can adjust and discover the rule. #learning #edtech" },
  { u: 35, type: 'text', tags: ['cpp', 'embedded'], media: '', content: "`constexpr` in modern C++ lets us compute lookup tables at compile time and place them straight into ROM flash, saving precious kilobytes of microcontroller SRAM. #cpp #embedded" },
  { u: 36, type: 'text', tags: ['research', 'writing'], media: '', content: "Finished transcribing a bundle of 1912 botanical expedition letters today. Pressed between pages 44 and 45 was a century-old fern frond, still intact! 🌿 #research #writing" },
  { u: 37, type: 'image_single', tags: ['ui', 'designengineering'], media: MEDIA.ui1, content: "Sweating the 1px inner border highlight (`rgba(255,255,255,0.08)`) on dark mode cards so surfaces separate cleanly without muddy drop shadows. #ui #designengineering" },
  { u: 38, type: 'text', tags: ['management', 'teams'], media: '', content: "One-on-ones shouldn't be status updates on Jira tickets. Use that time to ask: 'What's slowing you down right now?' and 'What kind of work do you want to be doing six months from now?' #management #teams" },
  { u: 39, type: 'image_single', tags: ['indiegames', 'storytelling'], media: MEDIA.shader, content: "Late-night playtest of the monsoon train sequence. Added rain streaks across the carriage window that refract the passing station lights. #indiegames #storytelling" },
  { u: 40, type: 'text', tags: ['copywriting', 'ux'], media: '', content: "Button labels should complete the sentence 'I want to...'—write 'Create workspace' or 'Export CSV' instead of vague 'Submit' or 'Continue'. #copywriting #ux" },
  { u: 41, type: 'text', tags: ['performance', 'web'], media: '', content: "Replaced a 180KB date formatting library with native `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat`. Zero bytes over the wire and built-in localization for every language! #performance #web" },
  { u: 42, type: 'image_single', tags: ['books', 'reading'], media: MEDIA.books1, content: "New arrivals table at the bookshop this morning: essays on urban architecture, translated Japanese short fiction, and a history of Indian typography. Come browse! #books #reading" },
  { u: 43, type: 'text', tags: ['travel', 'photography'], media: '', content: "Lesson from ten years of travel photography: arrive at the location 30 minutes before sunrise, put the camera down for the first five minutes, and just watch how the light wakes up the street. #travel #photography" },
  { u: 44, type: 'text', tags: ['ux', 'forms'], media: '', content: "Never clear a user's form inputs when validation fails on a single field. Preserving their typed state is basic digital courtesy. #ux #forms" },
  { u: 45, type: 'text', tags: ['systems', 'consensus'], media: '', content: "Re-reading the Raft paper alongside our production state machine logs. Leader leases are simple on paper until you account for VM pause times and clock drift. #systems #consensus" },
  { u: 46, type: 'image_single', tags: ['plotter', 'svg'], media: MEDIA.minimal1, content: "Two pens, metallic copper and indigo ink on dark navy cardstock. 52 minutes of plotting time for this concentric wave study. #plotter #svg" },
  { u: 47, type: 'text', tags: ['saas', 'indie'], media: '', content: "Automated my monthly bookkeeping script today. Spending 4 hours coding a tool that saves 2 hours every month is a classic indie developer joy. #saas #indie" },
  { u: 48, type: 'image_single', tags: ['acoustics', 'music'], media: MEDIA.synth1, content: "Measuring room impulse responses in a 200-year-old wooden concert hall. Natural reverberation decay is still the gold standard for spatial audio algorithms. #acoustics #music" },
  { u: 49, type: 'text', tags: ['javascript', 'memory'], media: '', content: "WeakMap is such a clean pattern for associating cached metadata with DOM nodes or object instances without preventing garbage collection when the node is removed. #javascript #memory" },
  { u: 50, type: 'text', tags: ['sustainability', 'software'], media: '', content: "Efficient software is green software. Cutting unnecessary polling requests and optimizing payload sizes across millions of clients saves real megawatt-hours in data centers and battery drain. #sustainability #software" },
  { u: 51, type: 'text', tags: ['cprogramming', 'unix'], media: '', content: "Wrote a tiny 200-line HTTP/1.1 static file server using `epoll` and `sendfile()` to demonstrate zero-copy kernel transfers to our interns today. Fundamentals never go out of style. #cprogramming #unix" },
  { u: 52, type: 'text', tags: ['graphicdesign', 'grids'], media: '', content: "Josef Müller-Brockmann's 'Grid Systems in Graphic Design' remains just as relevant for responsive CSS Grid layouts in 2026 as it was for Swiss posters in 1961. #graphicdesign #grids" },
  { u: 53, type: 'text', tags: ['student', 'coding'], media: '', content: "Pair programming with a friend in the library solved a race condition in 15 minutes that I had been staring at alone for four hours. Explaining code out loud works every time. #student #coding" },
  { u: 54, type: 'text', tags: ['databases', 'indexing'], media: '', content: "Dropped 6 unused indexes on our write-heavy events table after checking `pg_stat_user_indexes`. Write throughput jumped 28% and disk usage dropped by 14GB. #databases #indexing" },
  { u: 55, type: 'image_single', tags: ['architecture', 'craft'], media: MEDIA.arch1, content: "Hand-laid lime plaster walls curing in the afternoon breeze. Breathable materials age with grace instead of peeling after two monsoons. #architecture #craft" },
  { u: 56, type: 'image_single', tags: ['dataviz', 'design'], media: MEDIA.board1, content: "Sketching storyboards for an interactive explainer on urban water tables. Good data visualization starts with empathy for the reader's questions. #dataviz #design" },
  { u: 57, type: 'text', tags: ['devtools', 'onboarding'], media: '', content: "Audited 15 developer portals this week: the ones that let you run an interactive API call in the browser before creating an account have 3x higher activation. #devtools #onboarding" },
  { u: 58, type: 'text', tags: ['opensource', 'community'], media: '', content: "Tagged v2.0.0 of our bundler plugin tonight with a comprehensive migration guide and codemod script. Respecting downstream users during major version bumps builds lasting trust. #opensource #community" },
  { u: 59, type: 'text', tags: ['writing', 'focus'], media: '', content: "Turned my phone to grayscale mode for a week as an experiment. Screen time dropped 40% almost immediately without any willpower apps. #writing #focus" },
  { u: 60, type: 'image_single', tags: ['space', 'astrophotography'], media: MEDIA.nature1, content: "Crescent moon setting behind the Himalayan crest at twilight. Earthshine illuminating the dark lunar maria is visible even in a 2-second exposure. #space #astrophotography" },
  { u: 61, type: 'text', tags: ['uidesign', 'contrast'], media: '', content: "Never use pure `#000000` on pure `#FFFFFF` for everything, nor low-contrast `#777777` body text. Rich charcoal `#0F1419` on warm alabaster `#FBFBFC` is effortless to read for hours. #uidesign #contrast" },
  { u: 62, type: 'text', tags: ['benchmarks', 'infra'], media: '', content: "Always benchmark with realistic production data distributions—not uniform random strings. Skewed tenant keys and hot partitions are where real systems bend. #benchmarks #infra" },
  { u: 63, type: 'image_single', tags: ['storytelling', 'documentary'], media: MEDIA.street1, content: "Location scouting in old Kolkata tram depots this morning. Every weathered ticket window has a story waiting to be listened to. #storytelling #documentary" },
  { u: 64, type: 'text', tags: ['python', 'data'], media: '', content: "Polars DataFrames in Python are blazingly fast for time-series sensor windows. Processed 12 million accelerometer rows in under 900ms. #python #data" },
  { u: 65, type: 'text', tags: ['editorial', 'books'], media: '', content: "There is a special joy in opening a newly printed book, smelling the ink on uncoated paper, and seeing the chapter title page sit at the exact golden ratio you specified. #editorial #books" },

  // Wave 3 (133..200): Deep-dives on tech, design critiques, photography notes, startup realities, books, & everyday life
  { u: 1, type: 'text', tags: ['design', 'process'], media: '', content: "Started keeping a 'rejected explorations' page in every Figma file with a 1-sentence note on why each option didn't work. Saves so much circular debate when new stakeholders join mid-project. #design #process" },
  { u: 2, type: 'text', tags: ['distributed', 'engineering'], media: '', content: "Idempotent consumers + dead-letter queues with exponential backoff solve 95% of message broker headaches. Keep the topology simple and observable. #distributed #engineering" },
  { u: 3, type: 'image_single', tags: ['architecture', 'modernism'], media: MEDIA.minimal1, content: "Sun-breakers (brise-soleil) on a 1960s library facade in Pune. Concrete fins angled at 45 degrees block harsh afternoon glare while bouncing soft light onto the reading tables inside. #architecture #modernism" },
  { u: 4, type: 'text', tags: ['webgl', 'performance'], media: '', content: "Instanced mesh rendering reduced our draw calls from 1,800 down to 3 for the forest scene. Frame time dropped from 22ms to 2.1ms on integrated graphics. #webgl #performance" },
  { u: 5, type: 'text', tags: ['designsystems', 'accessibility'], media: '', content: "Focus states should never be `outline: none` without a high-contrast replacement. A 2px solid offset ring in your brand accent color looks sharp and keeps keyboard navigation first-class. #designsystems #accessibility" },
  { u: 6, type: 'text', tags: ['postgresql', 'databases'], media: '', content: "Using `LISTEN / NOTIFY` in Postgres for lightweight cache invalidation events across our 4 API nodes let us retire an entire separate pub/sub cluster. #postgresql #databases" },
  { u: 7, type: 'text', tags: ['studio', 'leadership'], media: '', content: "When scoping a creative project, always budget 20% of the timeline for 'the last 10%'—the transitions, empty states, loading skeletons, and edge cases that separate good from memorable. #studio #leadership" },
  { u: 8, type: 'text', tags: ['bootstrapping', 'indiedev'], media: '', content: "Answered a customer support ticket at 9 AM, reproduced the edge case, pushed a fix + regression test at 9:40 AM. The customer replied: 'I've never seen a company fix a bug in 40 minutes.' #bootstrapping #indiedev" },
  { u: 9, type: 'text', tags: ['compilers', 'rust'], media: '', content: "Pattern matching with exhaustive enum checks in Rust means when you add a new AST node variant, the compiler walks you through every single pass that needs to handle it. Refactoring without fear. #compilers #rust" },
  { u: 10, type: 'image_single', tags: ['pkm', 'localfirst'], media: MEDIA.notebook1, content: "Added bidirectional backlink graphs that compute locally in a Web Worker in under 12ms for 5,000 markdown notes. Zero server roundtrips required. #pkm #localfirst" },
  { u: 11, type: 'text', tags: ['film', '35mm'], media: '', content: "Pushing Ilford HP5 Plus to 1600 ISO for night street photography in Old Delhi. The contrast in the halogen shop lights feels timeless. #film #35mm" },
  { u: 12, type: 'text', tags: ['edgeai', 'hardware'], media: '', content: "Benchmarked int8 matrix multiplication kernels on ARM Neon today. Memory bandwidth—not raw FLOPs—is almost always the real bottleneck for small batch inference. #edgeai #hardware" },
  { u: 13, type: 'text', tags: ['writing', 'career'], media: '', content: "The best way to prepare for a senior role isn't memorizing frameworks—it's learning how to write a clear 1-page RFC that aligns three teams with competing priorities. #writing #career" },
  { u: 14, type: 'text', tags: ['opensource', 'student'], media: '', content: "My first Linux kernel documentation patch got accepted upstream today! Small typo fix in a driver comment, but seeing my commit in the tree feels surreal. #opensource #student" },
  { u: 15, type: 'text', tags: ['literature', 'books'], media: '', content: "Re-reading R.K. Narayan's Malgudi stories on a quiet evening. The warmth and gentle irony with which he observes everyday street life is unmatched. #literature #books" },
  { u: 16, type: 'text', tags: ['animation', 'ios'], media: '', content: "Spring animations with zero bounce (`dampingFraction = 1.0`) feel so much more responsive than linear or ease-in-out curves because they preserve momentum when interrupted mid-flight. #animation #ios" },
  { u: 17, type: 'image_single', tags: ['typography', 'editorial'], media: MEDIA.typo1, content: "Specimen sheet test print for our new serif italic. Balancing calligraphic energy with crisp legibility at 11pt footnote size took 14 revisions of the lowercase 'g' and 'a'. #typography #editorial" },
  { u: 18, type: 'text', tags: ['sre', 'incident'], media: '', content: "Chaos engineering rule #1: don't inject random faults in production until you've verified that your staging environment actually recovers automatically from a single node termination. #sre #incident" },
  { u: 19, type: 'text', tags: ['bioinformatics', 'data'], media: '', content: "Visualizing 3D protein binding pockets in WebGL inside our lab portal so collaborators can inspect hydrogen bonds right in the browser without installing desktop viewers. #bioinformatics #data" },
  { u: 20, type: 'text', tags: ['css', 'layout'], media: '', content: "CSS Subgrid finally solved the age-old card alignment problem where titles wrap to 2 lines in one card and 1 line in the next. Everything lines up across the row automatically. #css #layout" },
  { u: 21, type: 'image_single', tags: ['hardware', 'industrialdesign'], media: MEDIA.desk1, content: "Machined aluminum prototype knobs arrived! Testing knurling textures—fine diamond knurl vs straight flutes—for grip comfort. #hardware #industrialdesign" },
  { u: 22, type: 'text', tags: ['synth', 'ambient'], media: '', content: "Patching a generative Euclidean rhythm on the modular rack while rain taps against the studio skylight. Best way to unwind after a long mixing session. #synth #ambient" },
  { u: 23, type: 'text', tags: ['illustration', 'process'], media: '', content: "Limiting an editorial illustration to just two ink colors and paper white forces you to solve composition through shape and negative space rather than rendering effects. #illustration #process" },
  { u: 24, type: 'image_single', tags: ['transit', 'maps'], media: MEDIA.street1, content: "Visualizing 24 hours of metro train frequency and pedestrian catchment circles across Bengaluru. Good public transit turns a city into an interconnected ecosystem. #transit #maps" },
  { u: 25, type: 'text', tags: ['healthtech', 'ux'], media: '', content: "Designed a medication dosage confirmation modal that requires reading back the unit ('mg' vs 'mL') explicitly. Thoughtful friction in safety-critical software saves lives. #healthtech #ux" },
  { u: 26, type: 'text', tags: ['security', 'devsecops'], media: '', content: "Pinning GitHub Actions third-party workflows to full 40-character commit SHAs instead of mutable version tags takes 2 minutes and closes a huge supply-chain vector. #security #devsecops" },
  { u: 27, type: 'image_single', tags: ['craft', 'ceramics'], media: MEDIA.coffee1, content: "Morning espresso in a test-glaze cup from yesterday's firing. The iron spots in the local clay bled through the matte white glaze just the way I hoped. #craft #ceramics" },
  { u: 28, type: 'text', tags: ['analytics', 'data'], media: '', content: "Before building a real-time streaming pipeline with 5 Second latency, ask the business team how often they actually make decisions on that metric. 90% of the time, an hourly batch table is plenty. #analytics #data" },
  { u: 29, type: 'text', tags: ['urbanism', 'trees'], media: '', content: "Street trees aren't 'streetscape decoration'—they lower asphalt surface temperatures by up to 12°C, slow down traffic naturally, and make walking in summer humane. #urbanism #trees" },
  { u: 30, type: 'text', tags: ['devex', 'docs'], media: '', content: "Tested our getting-started guide by watching a new hire follow it word-for-word on a fresh laptop. Fixed 3 missing environment variable steps in 20 minutes. Always user-test your docs! #devex #docs" },
  { u: 31, type: 'text', tags: ['b2b', 'sales'], media: '', content: "The best B2B product demos don't start with a 15-minute company history slide deck—they open the product in the first 60 seconds and solve the prospect's exact workflow live. #b2b #sales" },
  { u: 32, type: 'text', tags: ['photography', 'editing'], media: '', content: "My photo editing rule: wait 24 hours after a shoot before culling and color grading. Fresh eyes always pick the quieter, more honest frames over the flashy ones. #photography #editing" },
  { u: 33, type: 'text', tags: ['neovim', 'cli'], media: '', content: "Paired `ripgrep` with a quickfix list macro today and refactored 140 call sites across 38 files in under two minutes. Unix composable tools age like fine wine. #neovim #cli" },
  { u: 34, type: 'image_single', tags: ['edtech', 'design'], media: MEDIA.board1, content: "Paper prototyping a fraction-bars game with 6th graders at a local school today. Their honest feedback is sharper than any executive design critique! #edtech #design" },
  { u: 35, type: 'text', tags: ['hardware', 'debugging'], media: '', content: "Rule of thumb in embedded engineering: if a bug seems impossible in software, check the ground plane and pull-up resistors with an oscilloscope first. #hardware #debugging" },
  { u: 36, type: 'image_single', tags: ['history', 'books'], media: MEDIA.books1, content: "Cataloging 19th-century astronomical star charts in the rare book room today. The copperplate engraving precision on these celestial coordinates is breathtaking. #history #books" },
  { u: 37, type: 'text', tags: ['motion', 'ui'], media: '', content: "Micro-interactions should feel like responsive physical materials, not cinema cutscenes. Keep UI transitions under 200ms so the interface never makes the user wait for an animation to finish. #motion #ui" },
  { u: 38, type: 'text', tags: ['remotework', 'culture'], media: '', content: "In distributed teams, writing is the primary engineering medium. Clear pull request descriptions and architectural decision records (ADRs) keep everyone aligned across time zones. #remotework #culture" },
  { u: 39, type: 'text', tags: ['gamedev', 'storytelling'], media: '', content: "Environmental storytelling tip: a half-packed suitcase and an unmailed postcard on a bench tell the player more about a character than three paragraphs of dialogue boxes. #gamedev #storytelling" },
  { u: 40, type: 'text', tags: ['branding', 'design'], media: '', content: "Consistency builds recognition, but small moments of surprise build affection. Give your brand system a strict grid and one playful signature element. #branding #design" },
  { u: 41, type: 'image_single', tags: ['nodejs', 'code'], media: MEDIA.code1, content: "Benchmarking Node.js native test runner vs legacy test suites—ran 420 unit tests in 1.1 seconds with zero external runner config. Built-in tooling has come so far. #nodejs #code" },
  { u: 42, type: 'text', tags: ['indiebookshop', 'community'], media: '', content: "Hosted 45 neighbors at our bookshop poetry & chai evening tonight! Proof that people are hungry for warm, offline community spaces. #indiebookshop #community" },
  { u: 43, type: 'text', tags: ['mountains', 'travel'], media: '', content: "Packing light for a 10-day trek in Himachal: one weather-sealed camera body, one 35mm lens, two spare batteries, and a pocket notebook. Less gear, more attention. #mountains #travel" },
  { u: 44, type: 'text', tags: ['uxresearch', 'accessibility'], media: '', content: "Include participants using assistive technologies in your regular usability studies—not just as a separate audit at the end of the year. Inclusive insights improve the product for everyone. #uxresearch #accessibility" },
  { u: 45, type: 'text', tags: ['distributed', 'databases'], media: '', content: " Monotonic clocks (`clock_gettime(CLOCK_MONOTONIC)`) for measuring durations, wall clocks only for display timestamps. Mixing the two during a leap-second or NTP step is a classic distributed bug. #distributed #databases" },
  { u: 46, type: 'text', tags: ['generativeart', 'svg'], media: '', content: "Implemented a hidden-line removal algorithm for 3D wireframe meshes exported to SVG so the pen plotter never draws overlapping strokes over wet ink. #generativeart #svg" },
  { u: 47, type: 'text', tags: ['saas', 'bootstrapping'], media: '', content: "Kept our tech stack deliberately boring for 3 years: Postgres, Express, vanilla JS, and a single VPS with automated daily backups. 99.98% uptime and zero 3 AM pages. #saas #bootstrapping" },
  { u: 48, type: 'text', tags: ['dsp', 'audio'], media: '', content: "Visualizing real-time spectrograms of Carnatic gamakas (microtonal oscillations). Seeing the continuous pitch curves explains why standard 12-tone MIDI quantization can't capture them. #dsp #audio" },
  { u: 49, type: 'text', tags: ['webperf', 'css'], media: '', content: "`content-visibility: auto` on long feed lists improved initial rendering time by 45% by skipping layout work for offscreen cards until the user scrolls near them. #webperf #css" },
  { u: 50, type: 'image_single', tags: ['climate', 'nature'], media: MEDIA.plant1, content: "Visited an agroforestry restoration plot in Tamil Nadu today where native shade trees have brought groundwater levels up by 4 meters in five years. Science + local stewardship works. #climate #nature" },
  { u: 51, type: 'text', tags: ['unix', 'philosophy'], media: '', content: "Doug McIlroy's UNIX philosophy—write programs that do one thing well and work together over text streams—is still the best architectural advice fifty years later. #unix #philosophy" },
  { u: 52, type: 'text', tags: ['packaging', 'sustainability'], media: '', content: "Designed a origami-folded single-sheet cardboard insert that holds glass dropper bottles securely in transit without a single piece of bubble wrap or tape. #packaging #sustainability" },
  { u: 53, type: 'text', tags: ['student', 'career'], media: '', content: "To fellow CS students: building and deploying one complete, working web app that solves a real problem for your campus club teaches you 10x more than passively watching 50 tutorial videos. #student #career" },
  { u: 54, type: 'text', tags: ['fintech', 'security'], media: '', content: "Webhook verification checklist: verify the HMAC-SHA256 signature using constant-time comparison (`crypto.timingSafeEqual`), check the timestamp window to prevent replay attacks, and log the event ID. #fintech #security" },
  { u: 55, type: 'text', tags: ['architecture', 'materials'], media: '', content: "Compressed stabilized earth blocks (CSEB) made from site-excavated soil have a fraction of the embodied carbon of fired brick and wonderful acoustic warmth. #architecture #materials" },
  { u: 56, type: 'text', tags: ['dataviz', 'clarity'], media: '', content: "Small multiples (a grid of 6 simple charts sharing the same scale) are almost always easier to read than a single spaghetti chart with 6 overlapping colored lines. #dataviz #clarity" },
  { u: 57, type: 'text', tags: ['writing', 'product'], media: '', content: "Read your UI copy out loud before shipping. If a confirmation modal sounds like a legal contract instead of a helpful colleague, rewrite it in half the words. #writing #product" },
  { u: 58, type: 'image_single', tags: ['opensource', 'typescript'], media: MEDIA.laptop1, content: "Saturday morning coffee and triaging GitHub issues. Closed 8 resolved bugs and published a patch release before breakfast. #opensource #typescript" },
  { u: 59, type: 'text', tags: ['pkm', 'habits'], media: '', content: "Weekly review ritual every Sunday evening: clear the desktop downloads folder, archive completed project notes, and pick the 3 most important outcomes for Monday. #pkm #habits" },
  { u: 60, type: 'text', tags: ['astrophotography', 'optics'], media: '', content: "Captured the Orion Nebula (M42) with a modest 135mm prime lens and a portable star tracker. You don't need an observatory dome to fall in love with deep-sky imaging. #astrophotography #optics" },
  { u: 61, type: 'image_single', tags: ['ui', 'designsystems'], media: MEDIA.ui2, content: "Teaching the 60-30-10 color rule in today's UI cohort: 60% calm neutral canvas, 30% secondary structure/surfaces, 10% purposeful brand accent for primary actions. #ui #designsystems" },
  { u: 62, type: 'text', tags: ['cloud', 'sre'], media: '', content: "Tested our multi-region failover script in a game-day drill this afternoon. Total DNS + read-replica promotion time: 48 seconds. Practice makes predictable. #cloud #sre" },
  { u: 63, type: 'text', tags: ['documentary', 'audio'], media: '', content: "In documentary filmmaking, clean location sound is 60% of the emotional immersion. Always record 60 seconds of 'room tone' silence in every space before packing up the mic. #documentary #audio" },
  { u: 64, type: 'text', tags: ['analytics', 'sports'], media: '', content: "Built a lightweight Streamlit dashboard so coaches can compare athlete sprint split times on an iPad right on the trackside within 5 seconds of a run. #analytics #sports" },
  { u: 65, type: 'text', tags: ['print', 'books'], media: '', content: "Smyth-sewn bindings that allow a hardcover book to lie completely flat on a desk without cracking the spine are one of civilization's finest inventions. 📖 #print #books" },
  { u: 1, type: 'text', tags: ['design', 'craft'], media: '', content: "Great software feels respectful of human attention: fast to load, clear in hierarchy, adaptable to light or dark rooms, and welcoming in your own language. Let's keep building tools like that. #design #craft" },
  { u: 3, type: 'image_single', tags: ['photography', 'kyoto'], media: MEDIA.kyoto1, content: "Evening lanterns reflecting on wet cobblestones after a brief autumn shower. Quiet streets reward slow walking. #photography #kyoto" },
  { u: 5, type: 'text', tags: ['ux', 'multilingual'], media: '', content: "Designing for multilingual interfaces tip: give buttons and navigation pills flexible horizontal padding so Hindi (Devanagari) and French labels never clip or overflow fixed widths. #ux #multilingual" },
];

// Pool of realistic, varied comments to attach deterministically
const COMMENT_TEMPLATES = [
  "This matches our exact experience over the last two quarters. Simplicity scales so much better than premature abstraction.",
  "Bookmarked this! Sharing with our team during tomorrow's architecture sync.",
  "The attention to detail here is wonderful. Thanks for sharing the process notes.",
  "100% agreed. Measuring first before reaching for a complex tool saves weeks of maintenance.",
  "Love the tonal balance and composition in this frame!",
  "Such a practical breakdown. Tested this approach last month and the difference was immediate.",
  "Framing the problem clearly first eliminates 80% of subjective back-and-forth.",
  "This is the kind of thoughtful craft that makes the web fun to build.",
  "Hard-earned production wisdom right here. Every line resonates.",
  "The texture and lighting in this shot are unreal—was this morning light?",
  "Subtracting complexity is always harder than adding features. Great milestone!",
  "Just tried this in my local setup and it worked like a charm. Thank you!",
  "Clear, humane, and well-reasoned. More teams need to hear this.",
  "Nothing beats testing with real users and watching where they pause.",
  "Saving this thread for my weekend reading list.",
  "The craftsmanship on the small details really shines through here.",
];

function buildPosts(users) {
  const now = Date.now();
  let cmtCounter = 1;

  return RAW_POSTS.map((p, index) => {
    const postIdx = index + 1;
    const authorUser = users[p.u - 1] || users[0];

    // Stagger timestamps smoothly across the last 28 days (newest first for early indices)
    const minutesAgo = postIdx <= 8
      ? [25, 65, 180, 240, 360, 540, 720, 900][postIdx - 1]
      : 960 + (postIdx - 8) * 195;
    const createdAt = new Date(now - minutesAgo * 60 * 1000);

    // Deterministic likes from 6 to 38 varied community users
    const likeCount = 6 + ((postIdx * 11) % 33);
    const likes = [];
    for (let k = 0; k < likeCount; k++) {
      const likerIdx = ((postIdx * 3 + k * 7) % users.length) + 1;
      const likerOid = userOid(likerIdx);
      if (!likes.some((id) => id.toString() === likerOid.toString())) {
        likes.push(likerOid);
      }
    }
    // Include user 1 (Meera) on specific posts for realistic liked state
    if (postIdx === 2 || postIdx === 5 || postIdx % 5 === 0) {
      const meeraId = userOid(1);
      if (!likes.some((id) => id.toString() === meeraId.toString())) {
        likes.push(meeraId);
      }
    }

    // Deterministic 1 to 3 realistic comments per post
    const numComments = (postIdx % 3) + 1;
    const comments = [];
    for (let c = 0; c < numComments; c++) {
      const commenterIdx = ((postIdx * 5 + c * 13 + 2) % users.length) + 1;
      const actualCommenterIdx = commenterIdx === p.u ? ((commenterIdx % users.length) + 1) : commenterIdx;
      const templateText = COMMENT_TEMPLATES[(postIdx + c * 3) % COMMENT_TEMPLATES.length];
      const commentTime = new Date(createdAt.getTime() + (c + 1) * 8 * 60 * 1000);

      comments.push({
        _id: cmtOid(cmtCounter++),
        author: userOid(actualCommenterIdx),
        text: templateText,
        createdAt: commentTime,
      });
    }

    return {
      _id: postOid(postIdx),
      seedKey: `vybe_seed_post_${String(postIdx).padStart(4, '0')}`,
      isDemo: true,
      author: authorUser._id,
      postType: p.type || 'text',
      content: p.content,
      mediaUrl: p.media || '',
      mediaGrid: p.mediaGrid || [],
      tags: p.tags || [],
      likes,
      comments,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

module.exports = {
  userOid,
  postOid,
  cmtOid,
  RAW_USERS,
  RAW_POSTS,
  buildUsers,
  buildPosts,
};
