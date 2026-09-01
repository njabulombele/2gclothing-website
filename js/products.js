const products = [
  {
    id: 1,
    name: "Original Two Gee — Black",
    category: "black",
    collection: "original",
    price: 350,
    tag: "bestseller",
    description: "The original Two Gee tee. Bold red brush stroke with clean white block letters. A statement piece that started it all.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p1.jpeg", "images/p2.jpeg"]
  },
  {
    id: 2,
    name: "2G Logo Oversized — Black",
    category: "black",
    collection: "signature",
    price: 380,
    tag: "new",
    description: "Oversized fit with the iconic bold 2G logo centre chest. Clean, minimal, unmistakable.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p3.jpeg", "images/p4.jpeg"]
  },
  {
    id: 3,
    name: "2G Stacked Fade — Black",
    category: "black",
    collection: "signature",
    price: 350,
    tag: "",
    description: "The stacked 2G fade logo — a gradient of identity. Subtle on the chest, loud in the culture.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p5.jpeg", "images/p6.jpeg"]
  },
  {
    id: 4,
    name: "TWOG Fashion Editorial — Black",
    category: "black",
    collection: "graphic",
    price: 420,
    tag: "new",
    description: "An editorial statement. The TW.O.G Fashion back print channels magazine energy — bold typography, vintage fashion photography, and the 2G world-view.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p7.jpeg", "images/p8.jpeg"]
  },
  {
    id: 5,
    name: "Operate With Style — Black",
    category: "black",
    collection: "operate",
    price: 400,
    tag: "bestseller",
    description: "The mantra, loud. Distressed grunge typography with the 2G identity baked in. Operate with Style is more than a slogan — it's a way of life.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p9.jpeg", "images/p10.jpeg"]
  },
  {
    id: 6,
    name: "Wave Seeker — Black",
    category: "black",
    collection: "graphic",
    price: 420,
    tag: "new",
    description: "Operate with Style. Wave Seeker. A skull with a mission — retro-illustrated back print that surfs between art and streetwear.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p11.jpeg", "images/p12.jpeg"]
  },
  {
    id: 7,
    name: "Summer Vibes — Black",
    category: "black",
    collection: "graphic",
    price: 420,
    tag: "",
    description: "Operate with Style. Enjoy the Summer Time. A skeleton in a bucket hat soaking it all in — because style doesn't take a holiday.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p13.jpeg", "images/p14.jpeg"]
  },
  {
    id: 8,
    name: "Coffee First Please — White",
    category: "white",
    collection: "graphic",
    price: 400,
    tag: "bestseller",
    description: "Coffee First Please. EST 2018. Two Gee Original Clothing. Deep forest green print on clean white — a morning ritual made into a tee.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p15.jpeg", "images/p16.jpeg"]
  },
  {
    id: 9,
    name: "Salt Licked Memories — White",
    category: "white",
    collection: "graphic",
    price: 420,
    tag: "new",
    description: "Two•Grans. Salt Licked Memories. A skeleton floating on the ocean, cocktail in hand. Vintage sunset tones on white — summer nostalgia in print form.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p17.jpeg", "images/p18.jpeg"]
  },
  {
    id: 10,
    name: "Two Grannies Script — White",
    category: "white",
    collection: "original",
    price: 350,
    tag: "",
    description: "Effortless. Just the cursive signature, nothing more. Two grannies. in handwritten script — minimal luxury.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p19.jpeg", "images/p20.jpeg"]
  },
  {
    id: 11,
    name: "Two Grannies Script — Ringer",
    category: "white",
    collection: "original",
    price: 380,
    tag: "new",
    description: "The script tee with a twist — black ringer collar and cuffs give this one a retro edge. Classic silhouette, original energy.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p21.jpeg", "images/p22.jpeg"]
  },
  {
    id: 12,
    name: "Two Grannies Original est·18 — White",
    category: "white",
    collection: "original",
    price: 350,
    tag: "",
    description: "The heritage piece. 2/G monogram with 'TWO GRANNIES Original est·18' — a clean, luxury-brand-inspired print that carries the full history of 2G.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p23.jpeg", "images/p24.jpeg"]
  },
  {
    id: 13,
    name: "Two Grans Clothing — White",
    category: "white",
    collection: "signature",
    price: 370,
    tag: "",
    description: "Front and back print. Small chest logo, large back statement. 'TWO Grans CLOTHING Original est. 2018' — wear the full brand.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p25.jpeg", "images/p26.jpeg"]
  },
  {
    id: 14,
    name: "2Gee Est. 2018 Script — White",
    category: "white",
    collection: "original",
    price: 370,
    tag: "bestseller",
    description: "Script meets structure. '2Gee EST 2018 CLOTHING' in elegant calligraphy — the brand mark in its most refined form.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p27.jpeg", "images/p28.jpeg"]
  },
  {
    id: 15,
    name: "2G Serif Minimal — White",
    category: "white",
    collection: "signature",
    price: 350,
    tag: "",
    description: "Bold serif '2G' with 'TWO GRANNIES' underneath. Clean. Confident. The kind of tee that lets the brand speak quietly.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p29.jpeg", "images/p30.jpeg"]
  },
  {
    id: 16,
    name: "2G Monogram — White",
    category: "white",
    collection: "signature",
    price: 350,
    tag: "",
    description: "The G2 monogram — a fused letterform that becomes its own mark. Minimalist chest placement, maximum identity.",
    sizes: ["S", "M", "L", "XL"],
    images: ["images/p31.jpeg", "images/p32.jpeg"]
  }
];
