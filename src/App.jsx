import { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ─── Percentile config ───
const PK = ["p10","p20","p25","p30","p40","median","p60","p70","p75","p80","p90"];
const PL = {p10:"10th",p20:"20th",p25:"25th",p30:"30th",p40:"40th",median:"50th",p60:"60th",p70:"70th",p75:"75th",p80:"80th",p90:"90th"};
const PV = {p10:10,p20:20,p25:25,p30:30,p40:40,median:50,p60:60,p70:70,p75:75,p80:80,p90:90};

// ─── ASHE 2025 Data ───
// Structure: DATA[period][genderWork] = array of age groups
// period: "annual" | "weekly"
// genderWork: "all" | "male" | "female" | "ft" | "pt" | "male_ft" | "female_ft"

const DATA = {
  annual: {
    all: [
      {label:"16–17",median:3985,mean:5471,p10:null,p20:1814,p25:2192,p30:2436,p40:3259,p60:4871,p70:6285,p75:null,p80:null,p90:null},
      {label:"18–21",median:13069,mean:15254,p10:3197,p20:5774,p25:6923,p30:8002,p40:10484,p60:16665,p70:20549,p75:22293,p80:24000,p90:27885},
      {label:"22–29",median:29855,mean:31719,p10:12284,p20:20251,p25:22993,p30:24500,p40:27000,p60:32802,p70:36276,p75:38391,p80:41108,p90:49651},
      {label:"30–39",median:36000,mean:42122,p10:13824,p20:22605,p25:25310,p30:27400,p40:31500,p60:41003,p70:46695,p75:50148,p80:54728,p90:69828},
      {label:"40–49",median:37734,mean:46636,p10:13767,p20:22249,p25:25147,p30:27472,p40:32361,p60:44028,p70:50892,p75:55117,p80:60686,p90:80316},
      {label:"50–59",median:34835,mean:44463,p10:12576,p20:20128,p25:23385,p30:25630,p40:29832,p60:40774,p70:48018,p75:51979,p80:57236,p90:76335},
      {label:"60+",median:26750,mean:33569,p10:8287,p20:12676,p25:15206,p30:17801,p40:22706,p60:31061,p70:36787,p75:40130,p80:44920,p90:59928},
    ],
    male: [
      {label:"16–17",median:4565,mean:6191,p10:null,p20:1957,p25:2296,p30:2550,p40:3452,p60:null,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:16598,mean:17803,p10:3786,p20:7198,p25:8492,p30:9911,p40:12980,p60:20169,p70:23261,p75:24523,p80:26032,p90:30064},
      {label:"22–29",median:31555,mean:34382,p10:14889,p20:23468,p25:25000,p30:26208,p40:28931,p60:34542,p70:38276,p75:40808,p80:43815,p90:52714},
      {label:"30–39",median:41000,mean:48911,p10:22556,p20:27890,p25:30000,p30:32014,p40:36333,p60:46041,p70:52302,p75:56417,p80:61341,p90:77879},
      {label:"40–49",median:45000,mean:55626,p10:22760,p20:28913,p25:31323,p30:34000,p40:39239,p60:50894,p70:58500,p75:63550,p80:69720,p90:92589},
      {label:"50–59",median:42699,mean:55756,p10:21462,p20:27642,p25:30000,p30:32391,p40:37364,p60:48874,p70:56178,p75:61601,p80:68674,p90:91567},
      {label:"60+",median:33425,mean:41903,p10:12000,p20:19844,p25:23224,p30:25331,p40:29368,p60:38319,p70:44522,p75:48467,p80:53158,p90:73093},
    ],
    female: [
      {label:"16–17",median:3728,mean:4867,p10:null,p20:1780,p25:2069,p30:2329,p40:3194,p60:4270,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:10850,mean:12811,p10:2853,p20:4836,p25:5861,p30:6824,p40:8736,p60:13363,p70:16968,p75:19093,p80:21053,p90:24956},
      {label:"22–29",median:27946,mean:29132,p10:10620,p20:17265,p25:20205,p30:22517,p40:25367,p60:30941,p70:34397,p75:36276,p80:38545,p90:46064},
      {label:"30–39",median:30930,mean:35282,p10:11431,p20:16932,p25:19747,p30:22605,p40:26997,p60:35565,p70:41000,p75:44150,p80:47616,p90:59010},
      {label:"40–49",median:30962,mean:38027,p10:11500,p20:16969,p25:19647,p30:22282,p40:26591,p60:36338,p70:43120,p75:47169,p80:51293,p90:65873},
      {label:"50–59",median:28124,mean:33942,p10:10162,p20:15185,p25:17687,p30:20078,p40:24343,p60:32538,p70:38894,p75:42993,p80:47428,p90:60427},
      {label:"60+",median:20422,mean:25202,p10:6288,p20:10269,p25:11930,p30:13271,p40:16843,p60:24132,p70:28310,p75:30763,p80:34093,p90:45182},
    ],
    ft: [
      {label:"16–17",median:14429,mean:14392,p10:null,p20:null,p25:null,p30:10513,p40:13247,p60:15357,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:23596,mean:24394,p10:14617,p20:17961,p25:19105,p30:20177,p40:21865,p60:24821,p70:26561,p75:27571,p80:28675,p90:32939},
      {label:"22–29",median:32347,mean:35760,p10:22758,p20:25372,p25:26429,p30:27510,p40:29970,p60:35159,p70:38558,p75:40850,p80:43521,p90:52197},
      {label:"30–39",median:40668,mean:48421,p10:25041,p20:29000,p25:30717,p30:32610,p40:36483,p60:45284,p70:50797,p75:54620,p80:59109,p90:75041},
      {label:"40–49",median:44244,mean:54591,p10:25338,p20:29726,p25:31858,p30:34095,p40:38871,p60:49672,p70:56343,p75:60919,p80:66625,p90:88658},
      {label:"50–59",median:41866,mean:53349,p10:24757,p20:28588,p25:30283,p30:32417,p40:36970,p60:47677,p70:53868,p75:58409,p80:64282,p90:85226},
      {label:"60+",median:36467,mean:46794,p10:23318,p20:26342,p25:27944,p30:29407,p40:32600,p60:40996,p70:46951,p75:50572,p80:55652,p90:74677},
    ],
    male_ft: [
      {label:"16–17",median:14398,mean:14373,p10:null,p20:null,p25:null,p30:null,p40:11952,p60:null,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:24107,mean:25848,p10:15731,p20:18662,p25:19825,p30:20800,p40:22784,p60:25681,p70:27419,p75:28553,p80:29836,p90:34006},
      {label:"22–29",median:33400,mean:37527,p10:23619,p20:26124,p25:27223,p30:28576,p40:30900,p60:36308,p70:40232,p75:42665,p80:45690,p90:54658},
      {label:"30–39",median:42899,mean:51919,p10:26345,p20:30411,p25:32350,p30:34267,p40:38518,p60:47993,p70:54298,p75:58361,p80:63323,p90:80241},
      {label:"40–49",median:47313,mean:59287,p10:27150,p20:32119,p25:34500,p30:36988,p40:41960,p60:53101,p70:60764,p75:65836,p80:72132,p90:95455},
      {label:"50–59",median:45608,mean:59793,p10:26599,p20:30994,p25:33358,p30:35636,p40:40126,p60:51263,p70:59024,p75:64399,p80:71527,p90:95045},
      {label:"60+",median:39348,mean:50390,p10:24808,p20:28344,p25:30000,p30:31500,p40:35072,p60:44167,p70:50277,p75:54499,p80:60000,p90:80609},
    ],
    female_ft: [
      {label:"16–17",median:15171,mean:14448,p10:null,p20:null,p25:null,p30:null,p40:null,p60:null,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:22464,mean:22104,p10:13209,p20:16709,p25:17968,p30:19083,p40:20878,p60:23937,p70:25072,p75:25857,p80:26831,p90:30000},
      {label:"22–29",median:31261,mean:33812,p10:21658,p20:24626,p25:25599,p30:26552,p40:28834,p60:33981,p70:37042,p75:38850,p80:41280,p90:48839},
      {label:"30–39",median:37745,mean:43600,p10:23452,p20:27200,p25:28990,p30:30470,p40:34034,p60:42100,p70:46749,p75:49727,p80:53390,p90:66064},
      {label:"40–49",median:39737,mean:48203,p10:23538,p20:27097,p25:29094,p30:30849,p40:35076,p60:45373,p70:50968,p75:54464,p80:59373,p90:76321},
      {label:"50–59",median:37024,mean:44456,p10:23099,p20:26106,p25:27575,p30:29117,p40:32534,p60:42324,p70:48231,p75:51335,p80:55480,p90:70335},
      {label:"60+",median:31583,mean:40184,p10:21312,p20:24034,p25:25176,p30:26309,p40:28753,p60:35473,p70:40320,p75:43971,p80:47396,p90:60970},
    ],
  },
  weekly: {
    all: [
      {label:"16–17",median:98.9,mean:135.4,p10:28,p20:44.7,p25:52.1,p30:59.7,p40:78.4,p60:122.1,p70:153.3,p75:175,p80:202,p90:290.9},
      {label:"18–21",median:300.2,mean:329.4,p10:70.7,p20:120.4,p25:147.5,p30:172.5,p40:228.8,p60:385.4,p70:456.3,p75:479.1,p80:503.1,p90:586},
      {label:"22–29",median:594.3,mean:635.4,p10:254.2,p20:439.2,p25:475.6,p30:498.1,p40:544.1,p60:651.6,p70:720.4,p75:766.5,p80:815.2,p90:980},
      {label:"30–39",median:716,mean:809.6,p10:298.5,p20:472.7,p25:515.6,p30:555.2,p40:632.4,p60:812,p70:924.3,p75:989.7,p80:1077.6,p90:1360.3},
      {label:"40–49",median:742.4,mean:880.1,p10:287.5,p20:460.8,p25:507,p30:550.7,p40:639,p60:863.7,p70:994.9,p75:1073.3,p80:1183.4,p90:1547.9},
      {label:"50–59",median:689.1,mean:840.7,p10:256.6,p20:416.1,p25:473.3,p30:513,p40:592.3,p60:804.1,p70:939.8,p75:1016.5,p80:1124.2,p90:1478.8},
      {label:"60+",median:531.8,mean:640.3,p10:167.1,p20:251.8,p25:299.5,p30:351.3,p40:456.3,p60:613.9,p70:724.4,p75:792.3,p80:877.1,p90:1172.9},
    ],
    male: [
      {label:"16–17",median:110.3,mean:153.7,p10:24.7,p20:45.7,p25:54.9,p30:61.8,p40:89.7,p60:139.1,p70:178.2,p75:204.8,p80:240.9,p90:332.7},
      {label:"18–21",median:370.8,mean:373.5,p10:88.2,p20:147.8,p25:178.4,p30:207,p40:280.1,p60:442.5,p70:488.4,p75:510.6,p80:538.6,p90:633},
      {label:"22–29",median:622.2,mean:680.7,p10:305.2,p20:475.4,p25:497.7,p30:521.2,p40:573.5,p60:681.4,p70:759.4,p75:803.5,p80:862.4,p90:1046.2},
      {label:"30–39",median:798.6,mean:915.4,p10:462.3,p20:555.1,p25:591.9,p30:632.4,p40:712.6,p60:896.9,p70:1015.7,p75:1095.5,p80:1188.6,p90:1496.7},
      {label:"40–49",median:876.9,mean:1033.7,p10:468.8,p20:574.9,p25:618.6,p30:667.4,p40:766.6,p60:987,p70:1134.6,p75:1232.4,p80:1350.6,p90:1763.8},
      {label:"50–59",median:842.1,mean:1029.6,p10:445.4,p20:549.2,p25:594.1,p30:636.6,p40:732.3,p60:958.2,p70:1103.9,p75:1207.3,p80:1334.5,p90:1736.8},
      {label:"60+",median:657.6,mean:790.2,p10:230,p20:388.5,p25:460.5,p30:500,p40:575.4,p60:749.6,p70:870.5,p75:950.3,p80:1056.7,p90:1397.3},
    ],
    female: [
      {label:"16–17",median:89.5,mean:120.5,p10:29.3,p20:43.4,p25:50.8,p30:56.9,p40:72.7,p60:110.4,p70:136.5,p75:155.3,p80:176,p90:241.4},
      {label:"18–21",median:243.4,mean:286.4,p10:60,p20:101.8,p25:123.5,p30:147.5,p40:195,p60:318.9,p70:401.9,p75:438.1,p80:467.2,p90:532},
      {label:"22–29",median:570.6,mean:590.7,p10:230.4,p20:385.4,p25:448.7,p30:476.4,p40:517.5,p60:621.5,p70:685.1,p75:723.8,p80:769.4,p90:921},
      {label:"30–39",median:627.4,mean:698.6,p10:240.5,p20:364.3,p25:425.1,p30:474.3,p40:550.4,p60:716.1,p70:823.4,p75:881.6,p80:957,p90:1187},
      {label:"40–49",median:615.2,mean:732.4,p10:239,p20:352.1,p25:409.1,p30:460,p40:534.1,p60:718.9,p70:856.9,p75:928.8,p80:1011.9,p90:1298.3},
      {label:"50–59",median:560.1,mean:664.5,p10:209.9,p20:311.6,p25:366.2,p30:413.5,p40:492,p60:647.8,p70:766.6,p75:845.6,p80:930,p90:1174.5},
      {label:"60+",median:410.2,mean:489,p10:131.6,p20:206.4,p25:239.1,p30:264.3,p40:334.6,p60:487.5,p70:562.5,p75:610.2,p80:679.1,p90:892.3},
    ],
    ft: [
      {label:"16–17",median:373.2,mean:413.4,p10:279.9,p20:298.9,p25:303.9,p30:317.8,p40:341.2,p60:395.6,p70:432.5,p75:439,p80:469,p90:null},
      {label:"18–21",median:498.5,mean:538.4,p10:392.7,p20:430,p25:444.4,p30:458.6,p40:479.1,p60:524.7,p70:556.8,p75:582.3,p80:612.4,p90:694.8},
      {label:"22–29",median:648.2,mean:726.2,p10:481,p20:517.5,p25:537.6,p30:559.4,p40:602.6,p60:702.1,p70:768.5,p75:814.5,p80:868.6,p90:1039.3},
      {label:"30–39",median:805.2,mean:928.9,p10:517.5,p20:584.5,p25:619.5,p30:655.4,p40:727.9,p60:895.5,p70:1004.9,p75:1075.5,p80:1163.1,p90:1459.4},
      {label:"40–49",median:870,mean:1029.7,p10:517.5,p20:594.2,p25:634.4,p30:677.5,p40:766.6,p60:971.2,p70:1100.5,p75:1190.8,p80:1307.1,p90:1685},
      {label:"50–59",median:831,mean:1008.5,p10:505,p20:574.2,p25:607,p30:645.2,p40:730.5,p60:934.4,p70:1061.8,p75:1152.5,p80:1263,p90:1637.1},
      {label:"60+",median:726.7,mean:896.3,p10:483,p20:535.4,p25:560.9,p30:589.7,p40:653.1,p60:814.4,p70:931.3,p75:1006.9,p80:1109.2,p90:1436.2},
    ],
    male_ft: [
      {label:"16–17",median:360,mean:408.1,p10:280.2,p20:299.5,p25:302.5,p30:317,p40:338.9,p60:387.4,p70:415.2,p75:436.2,p80:null,p90:null},
      {label:"18–21",median:511.2,mean:555.9,p10:398.6,p20:438.9,p25:455.4,p30:464.4,p40:488.3,p60:538.6,p70:575.3,p75:600,p80:632.3,p90:722.8},
      {label:"22–29",median:667.2,mean:755.5,p10:488.2,p20:529.9,p25:551.2,p30:574.4,p40:615.3,p60:726.3,p70:798.4,p75:849.8,p80:905.7,p90:1094.9},
      {label:"30–39",median:842.1,mean:976,p10:534.1,p20:606.1,p25:644,p30:679.9,p40:757.7,p60:935.7,p70:1054.1,p75:1136.5,p80:1234.5,p90:1534},
      {label:"40–49",median:925.4,mean:1104.7,p10:548,p20:636.3,p25:680.5,p30:727.8,p40:826,p60:1034.1,p70:1180.7,p75:1283.5,p80:1401.5,p90:1820.7},
      {label:"50–59",median:896.2,mean:1108.6,p10:537.2,p20:618.3,p25:660.1,p30:703.4,p40:794.9,p60:1011.7,p70:1164,p75:1263.5,p80:1388.9,p90:1795.3},
      {label:"60+",median:774.1,mean:959.1,p10:504.6,p20:567.8,p25:598.5,p30:629,p40:699.5,p60:870.3,p70:999.6,p75:1085.7,p80:1184.6,p90:1563.5},
    ],
    female_ft: [
      {label:"16–17",median:379.7,mean:425.1,p10:null,p20:294.1,p25:306.3,p30:319.1,p40:346.8,p60:427.8,p70:null,p75:null,p80:null,p90:null},
      {label:"18–21",median:486.8,mean:512,p10:386.5,p20:421.6,p25:434.4,p30:447.9,p40:465.9,p60:506.2,p70:532.3,p75:548,p80:574.9,p90:661.2},
      {label:"22–29",median:632.3,mean:693.8,p10:475,p20:508.4,p25:527,p30:546.7,p40:584.8,p60:681.5,p70:741.3,p75:780.2,p80:830.7,p90:981.9},
      {label:"30–39",median:759.5,mean:862.2,p10:498.3,p20:560.8,p25:591.4,p30:622.8,p40:690.1,p60:841.6,p70:937.1,p75:996.1,p80:1071.3,p90:1314.6},
      {label:"40–49",median:790.7,mean:927.2,p10:489.4,p20:555,p25:583.6,p30:619.5,p40:700.6,p60:893.6,p70:1005.7,p75:1071,p80:1167.3,p90:1476.3},
      {label:"50–59",median:736,mean:870.8,p10:479.1,p20:529.7,p25:558,p30:584,p40:651.9,p60:837.4,p70:942,p75:1012,p80:1092.4,p90:1378.8},
      {label:"60+",median:639.5,mean:780.3,p10:453.7,p20:493.1,p25:515.2,p30:536.6,p40:579.7,p60:712.6,p70:804.9,p75:862.6,p80:946.8,p90:1201.3},
    ],
  },
};

// ─── Helpers ───
function findGroup(age) {
  if (age <= 17) return "16–17";
  if (age <= 21) return "18–21";
  if (age <= 29) return "22–29";
  if (age <= 39) return "30–39";
  if (age <= 49) return "40–49";
  if (age <= 59) return "50–59";
  return "60+";
}

function estimatePercentile(group, salary) {
  if (!group) return null;
  const pts = PK.map(k => ({ p: PV[k], v: group[k] })).filter(pt => pt.v != null);
  if (pts.length < 2) return null;
  if (salary <= pts[0].v) return { value: pts[0].p, below: true };
  if (salary >= pts[pts.length-1].v) return { value: pts[pts.length-1].p, above: true };
  for (let i = 0; i < pts.length - 1; i++) {
    if (salary >= pts[i].v && salary <= pts[i+1].v) {
      const frac = (salary - pts[i].v) / (pts[i+1].v - pts[i].v);
      return { value: Math.round(pts[i].p + frac * (pts[i+1].p - pts[i].p)) };
    }
  }
  return null;
}

const fmtP = (v, isWeekly) => {
  if (v == null) return "—";
  if (isWeekly) return `£${v.toLocaleString("en-GB", {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
  return `£${v.toLocaleString("en-GB")}`;
};

const C = {
  bg:"#0b0e13",card:"#12161d",border:"#1f2430",
  gold:"#d4a843",blue:"#5b82b5",red:"#e05c3a",
  green:"#4ecb71",text:"#e8e6e1",muted:"#8a8578",
  dim:"#555249",faint:"#2a2d33",
};

const dotColor = (k) => ({
  p10:"#3565a0",p20:"#3d72ae",p25:"#4580ba",p30:"#4e8cc4",
  p40:"#5a9ad0",median:"#f5f0e8",p60:"#d4a843",p70:"#c49538",
  p75:"#b08530",p80:"#9c7428",p90:"#886420",
}[k] || C.blue);

function useContainerWidth(ref) {
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    obs.observe(ref.current);
    setWidth(ref.current.offsetWidth);
    return () => obs.disconnect();
  }, [ref]);
  return width;
}

// ─── Filter button component ───
function Pill({ active, onClick, children, isMobile }) {
  return (
    <button onClick={onClick} style={{
      padding: isMobile ? "8px 12px" : "7px 14px",
      borderRadius: 6, border: `1px solid ${active ? C.gold : C.faint}`,
      background: active ? C.gold + "18" : "transparent",
      color: active ? C.gold : C.dim,
      fontSize: isMobile ? 12 : 13, fontWeight: 500,
      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ─── Main component ───
export default function EarningsDashboard() {
  const [period, setPeriod] = useState("annual");
  const [gender, setGender] = useState("all");
  const [work, setWork] = useState("all");
  const [userAge, setUserAge] = useState("34");
  const [userSalary, setUserSalary] = useState("51200");
  const [activeIdx, setActiveIdx] = useState(null);
  const containerRef = useRef(null);
  const cw = useContainerWidth(containerRef);

  const isMobile = cw < 520;
  const isTablet = cw >= 520 && cw < 768;
  const isDesktop = cw >= 768;

  // Derive the data key
  const dataKey = useMemo(() => {
    if (gender === "all" && work === "all") return "all";
    if (gender === "all" && work === "ft") return "ft";
    if (gender === "male" && work === "all") return "male";
    if (gender === "female" && work === "all") return "female";
    if (gender === "male" && work === "ft") return "male_ft";
    if (gender === "female" && work === "ft") return "female_ft";
    // Fallback for combos we don't have
    return "all";
  }, [gender, work, period]);

  const data = DATA[period][dataKey] || DATA[period].all;
  const isWeekly = period === "weekly";

  const age = parseInt(userAge) || null;
  const rawSalary = parseFloat(userSalary.replace(/[£,\s]/g, "")) || null;
  // Convert user input to match the period
  const salary = rawSalary;
  const userGroupLabel = age ? findGroup(age) : null;
  const userGroup = data.find(d => d.label === userGroupLabel);
  const pctResult = userGroup && salary ? estimatePercentile(userGroup, salary) : null;

  const availableKeys = useMemo(() => PK.filter(k => data.some(d => d[k] != null)), [data]);

  const maxVal = Math.max(
    ...data.flatMap(d => PK.map(k => d[k]).filter(Boolean)),
    salary || 0
  );
  const chartMax = isWeekly
    ? Math.ceil(maxVal / 200) * 200 + 100
    : Math.ceil(maxVal / 10000) * 10000 + 5000;

  const LEFT = isMobile ? 44 : 64;
  const RIGHT_PAD = isMobile ? 12 : 30;
  const usableW = Math.max(200, cw - 8 - LEFT - RIGHT_PAD);
  const BW = Math.max(28, Math.min(74, Math.floor(usableW / data.length) - (isMobile ? 6 : 16)));
  const GAP = Math.max(4, Math.min(20, Math.floor((usableW - BW * data.length) / Math.max(1, data.length - 1))));
  const actualW = LEFT + data.length * BW + (data.length - 1) * GAP + RIGHT_PAD;
  const H = isMobile ? 320 : isTablet ? 370 : 420;
  const TOP = 46;
  const y = (v) => TOP + H - (v / chartMax) * H;

  const gridLines = [];
  const gridStep = isWeekly ? (isMobile ? 400 : 200) : (isMobile ? 20000 : 10000);
  for (let v = 0; v <= chartMax; v += gridStep) gridLines.push(v);

  const handleColumnInteract = useCallback((i) => {
    setActiveIdx(prev => prev === i ? null : i);
  }, []);

  const fs = {
    axisLabel: isMobile ? 9 : 11, gridLabel: isMobile ? 8 : 10,
    medianLabel: isMobile ? 9 : 11, pctLabel: isMobile ? 7 : 9,
    youLabel: isMobile ? 8 : 9, salaryLabel: isMobile ? 9 : 11,
  };
  const dotR = isMobile ? 3 : 4;
  const medR = isMobile ? 4.5 : 6;

  const fmtGrid = (v) => {
    if (v === 0) return "£0";
    if (isWeekly) return isMobile && v >= 1000 ? `£${(v/1000).toFixed(1)}k` : `£${v}`;
    return `£${(v/1000).toFixed(0)}k`;
  };

  const fmt = (v) => fmtP(v, isWeekly);

  // Description helpers
  const genderLabel = { all: "all employees", male: "male employees", female: "female employees" }[gender] || "employees";
  const workLabel = { all: "", ft: " (full-time)", pt: " (part-time)" }[work] || "";
  const cohortDesc = `${genderLabel}${workLabel}`;
  const periodLabel = isWeekly ? "weekly" : "annual";
  const periodUnit = isWeekly ? "/week" : "/year";

  // Check if current combo is available
  const comboAvailable = !!DATA[period][dataKey];

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      padding: isMobile ? "20px 10px" : "32px 20px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
      <div ref={containerRef} style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 20 : 26, fontWeight: 600, color: "#f5f0e8",
          margin: "0 0 4px",
        }}>UK Earnings by Age</h1>
        <p style={{ color: C.muted, fontSize: isMobile ? 11 : 13, margin: "0 0 20px" }}>
          ASHE 2025 Provisional · Office for National Statistics
        </p>

        {/* ── Filter row 1: Period / Gender / Work pattern ── */}
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 10 : 16, marginBottom: 16, flexWrap: "wrap",
        }}>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pay period</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={period==="annual"} onClick={() => setPeriod("annual")} isMobile={isMobile}>Annual</Pill>
              <Pill active={period==="weekly"} onClick={() => setPeriod("weekly")} isMobile={isMobile}>Weekly</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gender</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={gender==="all"} onClick={() => setGender("all")} isMobile={isMobile}>All</Pill>
              <Pill active={gender==="male"} onClick={() => setGender("male")} isMobile={isMobile}>Male</Pill>
              <Pill active={gender==="female"} onClick={() => setGender("female")} isMobile={isMobile}>Female</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Work pattern</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={work==="all"} onClick={() => setWork("all")} isMobile={isMobile}>All</Pill>
              <Pill active={work==="ft"} onClick={() => setWork("ft")} isMobile={isMobile}>Full-Time</Pill>
            </div>
          </div>
        </div>

        {/* ── User inputs ── */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end",
        }}>
          <div style={{ width: isMobile ? "35%" : 60, flexShrink: 0 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Your age</label>
            <input type="number" min="16" max="80" value={userAge}
              onChange={e => setUserAge(e.target.value)}
              style={{
                width: "100%", padding: "10px", borderRadius: 6,
                border: `1px solid ${C.faint}`, background: C.card,
                color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box",
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>
              {isWeekly ? "Weekly gross pay (£)" : "Annual salary (£)"}
            </label>
            <input type="text" inputMode="numeric" value={userSalary}
              onChange={e => setUserSalary(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                width: "100%", padding: "10px", borderRadius: 6,
                border: `1px solid ${C.faint}`, background: C.card,
                color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box",
              }} />
          </div>
        </div>

        {/* Not available warning */}
        {!comboAvailable && (
          <div style={{
            padding: "10px 16px", marginBottom: 12, borderRadius: 8,
            background: C.red + "15", border: `1px solid ${C.red}30`,
            color: C.muted, fontSize: 12,
          }}>
            This combination isn't published by ONS. Showing closest available data.
          </div>
        )}

        {/* ── Chart ── */}
        <div style={{ marginBottom: 8 }}>
          <svg width="100%" height={TOP + H + 60}
            viewBox={`0 0 ${actualW} ${TOP + H + 60}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", touchAction: "pan-y" }}>

            {gridLines.map(v => (
              <g key={v}>
                <line x1={LEFT - 4} x2={actualW - RIGHT_PAD + 4} y1={y(v)} y2={y(v)} stroke={C.faint} strokeWidth={0.7} />
                <text x={LEFT - 8} y={y(v) + 4} textAnchor="end" fill={C.dim}
                  fontSize={fs.gridLabel} fontFamily="'DM Sans', sans-serif">
                  {fmtGrid(v)}
                </text>
              </g>
            ))}

            {salary && (
              <>
                <line x1={LEFT - 4} x2={actualW - RIGHT_PAD + 4}
                  y1={y(salary)} y2={y(salary)}
                  stroke={C.red} strokeWidth={1.5} strokeDasharray="7,4" opacity={0.7} />
                <text x={actualW - RIGHT_PAD + 2} y={y(salary) - 6} textAnchor="end"
                  fill={C.red} fontSize={fs.salaryLabel} fontWeight={600}
                  fontFamily="'DM Sans', sans-serif">
                  {isMobile ? fmt(salary) : `You: ${fmt(salary)}`}
                </text>
              </>
            )}

            {data.map((d, i) => {
              const x = LEFT + i * (BW + GAP);
              const isUser = d.label === userGroupLabel;
              const isActive = activeIdx === i;
              const acc = isUser ? C.gold : C.blue;
              const pts = availableKeys
                .map(k => ({ key: k, val: d[k], lbl: PL[k], p: PV[k] }))
                .filter(p => p.val != null);
              const showDetail = isActive;

              return (
                <g key={d.label}
                  onMouseEnter={() => !isMobile && setActiveIdx(i)}
                  onMouseLeave={() => !isMobile && setActiveIdx(null)}
                  onClick={() => handleColumnInteract(i)}
                  style={{ cursor: "pointer" }}>

                  <rect x={x - GAP/2} y={TOP - 10} width={BW + GAP} height={H + 30} fill="transparent" />
                  {isUser && <rect x={x - 3} y={TOP - 3} width={BW + 6} height={H + 6}
                    rx={5} fill={C.gold + "08"} stroke={C.gold + "20"} strokeWidth={1} />}

                  {pts.length >= 2 && (
                    <line x1={x + BW/2} x2={x + BW/2}
                      y1={y(pts[pts.length-1].val)} y2={y(pts[0].val)}
                      stroke={acc} strokeWidth={1.5} opacity={0.15} />
                  )}

                  {d.p10 != null && d.p90 != null && (
                    <rect x={x + Math.max(2, BW*0.12)} y={y(d.p90)}
                      width={BW - Math.max(4, BW*0.24)}
                      height={y(d.p10) - y(d.p90)} rx={3} fill={acc} opacity={0.06} />
                  )}
                  {d.p25 != null && d.p75 != null && (
                    <rect x={x + Math.max(4, BW*0.18)} y={y(d.p75)}
                      width={BW - Math.max(8, BW*0.36)}
                      height={y(d.p25) - y(d.p75)} rx={2} fill={acc} opacity={0.12} />
                  )}

                  {pts.map(p => {
                    const isMed = p.key === "median";
                    const r = isMed ? medR : dotR;
                    const cy = y(p.val);
                    return (
                      <g key={p.key}>
                        <circle cx={x + BW/2} cy={cy} r={r}
                          fill={isMed ? "#f5f0e8" : dotColor(p.key)}
                          stroke={isMed ? acc : "none"} strokeWidth={isMed ? 2 : 0}
                          opacity={isMed ? 0.95 : 0.75} />
                        {showDetail ? (
                          <text x={x + BW/2 + r + 3} y={cy + 3}
                            fill={isMed ? "#f5f0e8" : C.muted}
                            fontSize={isMed ? fs.medianLabel : fs.pctLabel}
                            fontWeight={isMed ? 700 : 400}
                            fontFamily="'DM Sans', sans-serif">
                            {p.lbl}
                          </text>
                        ) : isMed ? (
                          <text x={x + BW/2 + r + 3} y={cy + 3}
                            fill="#f5f0e8" fontSize={fs.medianLabel} fontWeight={700}
                            fontFamily="'DM Sans', sans-serif" opacity={0.85}>
                            {isMobile ? (isWeekly ? `£${Math.round(p.val)}` : `£${(p.val/1000).toFixed(0)}k`) : fmt(p.val)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}

                  {isUser && salary && (
                    <>
                      <circle cx={x + BW/2} cy={y(salary)} r={isMobile ? 6 : 8}
                        fill={C.red} stroke={C.bg} strokeWidth={2.5} />
                      <circle cx={x + BW/2} cy={y(salary)} r={isMobile ? 10 : 13}
                        fill="none" stroke={C.red} strokeWidth={1.5} opacity={0.25}>
                        <animate attributeName="r" from={isMobile?"8":"10"} to={isMobile?"13":"16"} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  <text x={x + BW/2} y={TOP + H + 18} textAnchor="middle"
                    fill={isUser ? C.gold : C.muted}
                    fontSize={fs.axisLabel} fontWeight={isUser ? 700 : 400}
                    fontFamily="'DM Sans', sans-serif">
                    {d.label}
                  </text>
                  {isUser && (
                    <text x={x + BW/2} y={TOP + H + (isMobile ? 30 : 32)} textAnchor="middle"
                      fill={C.gold} fontSize={fs.youLabel} fontWeight={600}
                      fontFamily="'DM Sans', sans-serif" letterSpacing="0.06em">
                      ▲ YOU
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", gap: isMobile ? 10 : 16, flexWrap: "wrap",
          fontSize: isMobile ? 10 : 11, color: C.muted, marginBottom: 6, paddingLeft: 4,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#f5f0e8", border: `2px solid ${C.blue}`, display: "inline-block" }} /> Median
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, opacity: 0.75, display: "inline-block" }} /> Percentile
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 7, borderRadius: 2, background: C.blue, opacity: 0.12, display: "inline-block" }} /> P25–P75
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 0, borderTop: `2px dashed ${C.red}`, display: "inline-block" }} /> Your pay
          </span>
        </div>
        {isMobile && (
          <p style={{ fontSize: 10, color: C.dim, textAlign: "center", margin: "4px 0 0" }}>
            Tap a column to see percentile labels
          </p>
        )}

        {/* ── Results card ── */}
        {age && salary && userGroup ? (
          <div style={{
            marginTop: 20,
            padding: isMobile ? "16px 16px" : "22px 26px",
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 16 : 18, color: C.gold, marginBottom: 10,
            }}>Where you stand</div>
            <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.8, color: "#c5c0b6" }}>
              {(() => {
                const med = userGroup.median;
                const diff = salary - med;
                const pctDiff = Math.round(Math.abs(diff) / med * 100);
                return (
                  <>
                    At <strong style={{ color: C.red }}>{fmt(salary)}{periodUnit}</strong> aged{" "}
                    <strong style={{ color: C.gold }}>{age}</strong>, you fall in the{" "}
                    <strong style={{ color: C.text }}>{userGroupLabel}</strong> age group.
                    {" "}The median {periodLabel} gross pay for {cohortDesc} in this group is{" "}
                    <strong style={{ color: C.text }}>{fmt(med)}</strong>.
                    {diff > 0
                      ? <>{" "}You're earning <strong style={{ color: C.green }}>{fmt(Math.abs(diff))} ({pctDiff}%) above</strong> the median.</>
                      : diff < 0
                      ? <>{" "}You're earning <strong style={{ color: C.red }}>{fmt(Math.abs(diff))} ({pctDiff}%) below</strong> the median.</>
                      : <>{" "}You're <strong>right on</strong> the median.</>
                    }
                    {pctResult && (
                      pctResult.below
                        ? <>{" "}That places you <strong style={{ color: C.gold }}>below the {pctResult.value}th percentile</strong> — earning less than roughly {100 - pctResult.value}% of {cohortDesc} in your age bracket.</>
                        : pctResult.above
                        ? <>{" "}That places you <strong style={{ color: C.gold }}>above the {pctResult.value}th percentile</strong> — earning more than at least {pctResult.value}% of {cohortDesc} in your age bracket.</>
                        : <>{" "}That puts you at roughly the <strong style={{ color: C.gold }}>{pctResult.value}th percentile</strong> — earning more than about {pctResult.value}% of {cohortDesc} in your age bracket.</>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Percentile grid */}
            <div style={{
              marginTop: 14, padding: isMobile ? "10px 10px" : "14px 16px",
              background: C.bg, borderRadius: 8,
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(110px, 1fr))",
              gap: isMobile ? "4px 10px" : "5px 14px",
              fontSize: isMobile ? 11 : 12,
            }}>
              {availableKeys.map(k => {
                const val = userGroup[k];
                if (val == null) return null;
                const isAbove = salary >= val;
                const isNearest = pctResult && !pctResult.below && !pctResult.above &&
                  Math.abs(PV[k] - pctResult.value) <= 5;
                return (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "4px 6px", borderRadius: 4,
                    background: isNearest ? C.gold + "15" : "transparent",
                  }}>
                    <span style={{ color: C.muted }}>{PL[k]}</span>
                    <span style={{
                      color: isNearest ? C.gold : (isAbove ? C.green + "bb" : C.muted),
                      fontWeight: isNearest ? 600 : 400,
                      fontVariantNumeric: "tabular-nums",
                    }}>{fmt(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: 20, padding: "18px 20px",
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            color: C.muted, fontSize: 14, textAlign: "center",
          }}>
            Enter your age and {isWeekly ? "weekly pay" : "annual salary"} above to see where you fall.
          </div>
        )}

        <p style={{
          fontSize: isMobile ? 9 : 10, color: "#3a3830",
          marginTop: 16, lineHeight: 1.5,
        }}>
          Source: ONS Annual Survey of Hours and Earnings (ASHE) 2025 Provisional.
          Employees on adult rates in same job for &gt;1 year.
          {isDesktop && " Hover columns for detail."}
        </p>
      </div>
    </div>
  );
}
