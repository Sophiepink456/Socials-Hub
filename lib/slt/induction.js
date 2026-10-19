// The induction schedule (Figma rD8fazmrI53ABdD4hWcTrn "ERG Induction 2026", "Schedule — Buddy").
// One A4 landscape page (1123 x 794 px). Everyone on it is picked from the hub's headshots.
import manifest from "../manifest.json";

// The seven colours of the key, in the Figma's order. `text` is the colour used for words
// (purple is lightened there so it reads on the dark background).
export const OWNERS = [
  { id: "green", ring: "#93c01f", text: "#93c01f", label: "Green" },
  { id: "orange", ring: "#ff751f", text: "#ff751f", label: "Orange" },
  { id: "red", ring: "#ff3131", text: "#ff3131", label: "Red" },
  { id: "purple", ring: "#8c52ff", text: "#c0a0ff", label: "Purple" },
  { id: "yellow", ring: "#ffde59", text: "#ffde59", label: "Yellow" },
  { id: "pink", ring: "#ff66c4", text: "#ff66c4", label: "Pink" },
  { id: "blue", ring: "#38b6ff", text: "#38b6ff", label: "Blue" },
];
export const ownerById = (id) => OWNERS.find((o) => o.id === id) || null;

// Headshots to choose from: the hub's library, plus anyone added just for inductions.
const EXTRA = [{ name: "Shea Turvey", path: "/headshots/Shea Turvey.jpg" }];
export const PEOPLE = [...(manifest.headshots || []), ...EXTRA.filter((e) => !(manifest.headshots || []).some((h) => h.name === e.name))]
  .sort((a, b) => a.name.localeCompare(b.name));
export const photoOf = (name) => {
  const n = String(name || "").trim().toLowerCase();
  const h = PEOPLE.find((p) => p.name.toLowerCase() === n);
  return h ? h.path : "";
};

export const MAX_DAYS = 10;
export const MAX_SESSIONS = 6;

const WEEKS = [
  {
    "label": "WEEK 1",
    "days": [
      {
        "name": "Tuesday",
        "note": "",
        "am": [
          {
            "text": "Meet & Greet: Welcome Presentation",
            "who": "green"
          },
          {
            "text": "Managers Welcome to the Business",
            "who": "blue"
          }
        ],
        "lunch": "Team Lunch",
        "pm": [
          {
            "text": "Admin & IT Setup",
            "who": "yellow"
          },
          {
            "text": "Expenses & Time Off: What You Need to Know",
            "who": "orange"
          },
          {
            "text": "Intro to System",
            "who": "pink"
          }
        ]
      },
      {
        "name": "Wednesday",
        "note": "",
        "am": [
          {
            "text": "Headshot & LinkedIn Graphics",
            "who": "yellow"
          },
          {
            "text": "LinkedIn Updates: Pic, Banner, Bio & Role Change",
            "who": "none"
          },
          {
            "text": "LinkedIn: Joined the Team Post",
            "who": "none"
          },
          {
            "text": "Intro to System Cont.",
            "who": "pink"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "Logicmelon, Boolean & Advert Writing",
            "who": "pink"
          },
          {
            "text": "Compliance Training",
            "who": "pink"
          }
        ]
      },
      {
        "name": "Thursday",
        "note": "",
        "am": [
          {
            "text": "ERG Terminology Training",
            "who": "blue"
          },
          {
            "text": "Pre-Reg/Interview Training & Role Plays",
            "who": "blue"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "Linked, RPS & AI Training",
            "who": "red"
          },
          {
            "text": "LinkedIn Training: Connecting with businesses & contacts",
            "who": "pink"
          },
          {
            "text": "LinkedIn Connections",
            "who": "none"
          },
          {
            "text": "Check-In",
            "who": "green"
          }
        ]
      },
      {
        "name": "Friday",
        "note": "(WFH)",
        "am": [
          {
            "text": "Role Brief: Job Board Searching/Sourcing for the Team",
            "who": "none"
          },
          {
            "text": "Write & Send 3x Adverts: Resourcer to Check & Post",
            "who": "none"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "As Above",
            "who": "none"
          },
          {
            "text": "End of Week Check-In",
            "who": "blue"
          },
          {
            "text": "3pm Finish",
            "who": "none"
          }
        ]
      }
    ]
  },
  {
    "label": "WEEK 2",
    "days": [
      {
        "name": "Monday",
        "note": "",
        "am": [
          {
            "text": "The Elevation Way: Team Expectations, KPI’s & Processes",
            "who": "green"
          },
          {
            "text": "Ad Response & Pre-Reg New Candidates",
            "who": "pink"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "Sales Point Training & Role Plays",
            "who": "blue"
          }
        ]
      },
      {
        "name": "Tuesday",
        "note": "",
        "am": [
          {
            "text": "Taking in a Job & Role Plays",
            "who": "blue"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "BD Plug-In Session",
            "who": "purple"
          }
        ]
      },
      {
        "name": "Wednesday",
        "note": "",
        "am": [
          {
            "text": "DESK LIVE",
            "who": "none"
          },
          {
            "text": "BD Plug-In Session",
            "who": "purple"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "BUD Training",
            "who": "blue"
          }
        ]
      },
      {
        "name": "Thursday",
        "note": "",
        "am": [
          {
            "text": "DESK LIVE: Sit in Reg",
            "who": "none"
          },
          {
            "text": "Feedback Session & Plan for PM & Friday",
            "who": "blue"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "DESK LIVE: Practice Searching & Longlisting on Tracker for Job Specs Given",
            "who": "none"
          },
          {
            "text": "Advert Responses, Pre-Reg Calls, New Advert Posts & Update Calls",
            "who": "none"
          },
          {
            "text": "Check-In",
            "who": "green"
          }
        ]
      },
      {
        "name": "Friday",
        "note": "(WFH)",
        "am": [
          {
            "text": "DESK LIVE: Practice Searching & Longlisting on Tracker for Job Specs Given",
            "who": "none"
          },
          {
            "text": "Advert Responses, Pre-Reg Calls, New Advert Posts & Update Calls",
            "who": "none"
          }
        ],
        "lunch": "",
        "pm": [
          {
            "text": "As Above",
            "who": "none"
          },
          {
            "text": "End of Week Check-In",
            "who": "blue"
          },
          {
            "text": "3pm Finish",
            "who": "none"
          }
        ]
      }
    ]
  }
];

export const INDUCTION_DEFAULT = {
  kind: "induction",
  title: "INDUCTION",
  intro1: "Welcome to your induction programme. This schedule will help you settle into your new role and meet the key people you will be working with.",
  intro2: "Each task is colour-coded to show who you will be meeting for that session. Please refer to the colour key below. If you have any questions, please just ask!",
  starter: "",
  buddy: "Sophie Hodgson",
  key: [
    { owner: "green", person: "Steph Sheedy" },
    { owner: "orange", person: "Lucy Baldry" },
    { owner: "red", person: "Sarah-Lee Neesam" },
    { owner: "purple", person: "Andrea Knipe" },
    { owner: "yellow", person: "Shea Turvey" },
    { owner: "pink", person: "Charlotte Bates" },
    { owner: "blue", person: "Kelly West" },
  ],
  weeks: WEEKS,
};

const str = (v) => (v == null ? "" : String(v));
const clone = (x) => JSON.parse(JSON.stringify(x));
const sess = (list) => (Array.isArray(list) ? list : []).slice(0, MAX_SESSIONS).map((s) => ({ text: str(s && s.text), who: ownerById(s && s.who) ? s.who : "none" }));
const day = (d) => ({ name: str(d && d.name), note: str(d && d.note), am: sess(d && d.am), lunch: str(d && d.lunch), pm: sess(d && d.pm) });

export function blankInduction() {
  return clone(INDUCTION_DEFAULT);
}

export function normaliseInduction(input) {
  const d = { ...clone(INDUCTION_DEFAULT), ...(input && typeof input === "object" ? input : {}) };
  d.kind = "induction";
  for (const k of ["title", "intro1", "intro2", "buddy", "starter"]) d[k] = str(d[k]);
  d.key = OWNERS.map((o) => {
    const k = (Array.isArray(d.key) ? d.key : []).find((x) => x && x.owner === o.id);
    return { owner: o.id, person: str(k && k.person) };
  });
  d.weeks = (Array.isArray(d.weeks) ? d.weeks : []).slice(0, 2).map((w) => ({ label: str(w && w.label), days: (Array.isArray(w && w.days) ? w.days : []).slice(0, 5).map(day) }));
  return d;
}

export const inductionFileName = (d) =>
  `${["Induction", d.starter].filter((x) => String(x || "").trim()).join(" - ").replace(/[\\/:*?"<>|]+/g, "").trim() || "Induction"}.pdf`;
