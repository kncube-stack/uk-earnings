import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import EarningsChart from "./components/EarningsChart";
import GenderGapCard from "./components/GenderGapCard";
import GenderGapChart from "./components/GenderGapChart";
import InsightCard from "./components/InsightCard";
import Pill from "./components/Pill";
import { INDUSTRY_DATA, INDUSTRY_OPTIONS } from "./data/asheIndustry";
import { AGE_OCCUPATION_DATA, OCCUPATION_AGE_BANDS } from "./data/asheOccupationByAge";
import { OCCUPATION_DATA, OCCUPATION_OPTIONS } from "./data/asheOccupation";
import {
  AGE_GAP_DATA,
  AGE_OCCUPATION_GAP_DATA,
  GAP_BENCHMARKS,
  INDUSTRY_GAP_DATA,
  OCCUPATION_GAP_DATA,
  REGION_GAP_DATA,
  SECTOR_GAP_DATA,
} from "./data/asheGenderGap";
import { REGION_DATA, REGION_OPTIONS } from "./data/asheRegion";
import { SECTOR_DATA, SECTOR_OPTIONS } from "./data/asheSector";
import { useContainerWidth } from "./hooks/useContainerWidth";
import { PK } from "./percentiles";
import { C } from "./theme";
import { estimatePercentile, findGroup } from "./utils/earnings";

// ─── ASHE 2025 Data ───
// Structure: DATA[period][genderWork] = array of age groups
// period: "annual" | "weekly" | "hourly" | "hours"
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
  hourly: {
    all: [
      {label:"16\u201317",median:9.52,mean:10.29,p10:7.55,p20:7.55,p25:7.83,p30:8.0,p40:8.78,p60:10.0,p70:11.45,p75:12.21,p80:12.48,p90:13.48},
      {label:"18\u201321",median:12.59,mean:13.6,p10:10.0,p20:11.44,p25:12.1,p30:12.21,p40:12.32,p60:12.99,p70:13.57,p75:13.95,p80:14.46,p90:16.5},
      {label:"22\u201329",median:15.88,mean:18.51,p10:12.41,p20:13.0,p25:13.38,p30:13.75,p40:14.75,p60:17.49,p70:19.43,p75:20.53,p80:22.07,p90:26.75},
      {label:"30\u201339",median:19.7,mean:23.51,p10:12.79,p20:14.0,p25:14.76,p30:15.54,p40:17.39,p60:22.36,p70:25.47,p75:27.41,p80:29.69,p90:37.56},
      {label:"40\u201349",median:20.65,mean:25.91,p10:12.76,p20:14.03,p25:14.85,p30:15.72,p40:18.0,p60:23.97,p70:27.64,p75:29.8,p80:32.79,p90:43.2},
      {label:"50\u201359",median:19.31,mean:25.23,p10:12.63,p20:13.69,p25:14.37,p30:15.04,p40:16.9,p60:22.59,p70:26.19,p75:28.47,p80:31.17,p90:41.03},
      {label:"60+",median:16.45,mean:21.91,p10:12.36,p20:12.96,p25:13.33,p30:13.8,p40:14.92,p60:18.69,p70:21.81,p75:23.67,p80:26.36,p90:34.84},
    ],
    male: [
      {label:"16\u201317",median:9.52,mean:10.31,p10:7.55,p20:7.57,p25:7.86,p30:8.0,p40:8.92,p60:10.0,p70:11.2,p75:12.06,p80:12.38,p90:13.45},
      {label:"18\u201321",median:12.63,mean:13.86,p10:10.05,p20:11.52,p25:12.17,p30:12.21,p40:12.38,p60:13.12,p70:13.79,p75:14.15,p80:14.71,p90:16.76},
      {label:"22\u201329",median:16.14,mean:18.96,p10:12.45,p20:13.06,p25:13.5,p30:13.92,p40:14.98,p60:17.74,p70:19.74,p75:20.92,p80:22.49,p90:27.41},
      {label:"30\u201339",median:20.6,mean:24.53,p10:13.12,p20:14.58,p25:15.38,p30:16.29,p40:18.3,p60:23.4,p70:26.79,p75:28.94,p80:31.56,p90:40.1},
      {label:"40\u201349",median:22.7,mean:27.74,p10:13.25,p20:15.0,p25:16.0,p30:17.13,p40:19.68,p60:25.95,p70:29.94,p75:32.78,p80:36.3,p90:47.38},
      {label:"50\u201359",median:21.72,mean:27.86,p10:13.09,p20:14.65,p25:15.56,p30:16.52,p40:18.94,p60:25.05,p70:29.39,p75:32.06,p80:35.74,p90:47.15},
      {label:"60+",median:18.3,mean:23.78,p10:12.55,p20:13.55,p25:14.14,p30:14.77,p40:16.32,p60:20.88,p70:24.31,p75:26.88,p80:29.77,p90:40.02},
    ],
    female: [
      {label:"16\u201317",median:9.52,mean:10.28,p10:null,p20:7.55,p25:7.75,p30:8.0,p40:8.66,p60:10.09,p70:11.64,p75:12.22,p80:12.5,p90:13.54},
      {label:"18\u201321",median:12.55,mean:13.27,p10:10.0,p20:11.29,p25:12.0,p30:12.21,p40:12.3,p60:12.84,p70:13.4,p75:13.72,p80:14.16,p90:16.22},
      {label:"22\u201329",median:15.6,mean:18.03,p10:12.4,p20:12.93,p25:13.25,p30:13.62,p40:14.49,p60:17.23,p70:19.15,p75:20.24,p80:21.63,p90:26.2},
      {label:"30\u201339",median:18.66,mean:22.25,p10:12.6,p20:13.54,p25:14.15,p30:14.88,p40:16.51,p60:21.15,p70:24.03,p75:25.89,p80:27.89,p90:34.47},
      {label:"40\u201349",median:18.95,mean:23.79,p10:12.56,p20:13.47,p25:14.03,p30:14.76,p40:16.46,p60:22.06,p70:25.59,p75:27.49,p80:29.75,p90:38.31},
      {label:"50\u201359",median:17.33,mean:22.19,p10:12.5,p20:13.14,p25:13.61,p30:14.16,p40:15.49,p60:20.04,p70:23.47,p75:25.48,p80:27.69,p90:34.95},
      {label:"60+",median:15.01,mean:19.41,p10:12.26,p20:12.62,p25:12.9,p30:13.18,p40:13.98,p60:16.57,p70:19.18,p75:20.92,p80:23.07,p90:29.5},
    ],
    ft: [
      {label:"16\u201317",median:9.0,mean:10.41,p10:7.55,p20:7.56,p25:7.74,p30:8.0,p40:8.62,p60:9.92,p70:11.04,p75:11.67,p80:12.16,p90:null},
      {label:"18\u201321",median:12.94,mean:13.78,p10:10.24,p20:12.0,p25:12.21,p30:12.25,p40:12.56,p60:13.41,p70:14.0,p75:14.43,p80:15.0,p90:16.9},
      {label:"22\u201329",median:16.69,mean:18.83,p10:12.65,p20:13.46,p25:13.87,p30:14.37,p40:15.38,p60:18.26,p70:20.14,p75:21.27,p80:22.78,p90:27.36},
      {label:"30\u201339",median:20.87,mean:24.09,p10:13.38,p20:14.95,p25:15.76,p30:16.62,p40:18.66,p60:23.46,p70:26.58,p75:28.62,p80:30.9,p90:38.72},
      {label:"40\u201349",median:22.6,mean:26.78,p10:13.45,p20:15.13,p25:16.14,p30:17.25,p40:19.68,p60:25.68,p70:29.26,p75:31.68,p80:34.89,p90:45.27},
      {label:"50\u201359",median:21.36,mean:26.23,p10:13.2,p20:14.71,p25:15.53,p30:16.4,p40:18.65,p60:24.43,p70:28.15,p75:30.65,p80:33.65,p90:43.83},
      {label:"60+",median:18.39,mean:23.13,p10:12.76,p20:13.83,p25:14.42,p30:15.04,p40:16.5,p60:20.84,p70:23.94,p75:26.25,p80:29.06,p90:38.33},
    ],
    male_ft: [
      {label:"16\u201317",median:9.0,mean:10.26,p10:null,p20:7.55,p25:7.7,p30:7.9,p40:8.62,p60:9.94,p70:11.03,p75:11.21,p80:11.82,p90:null},
      {label:"18\u201321",median:13.0,mean:13.98,p10:10.16,p20:11.78,p25:12.21,p30:12.24,p40:12.58,p60:13.54,p70:14.24,p75:14.66,p80:15.16,p90:17.1},
      {label:"22\u201329",median:16.8,mean:19.22,p10:12.66,p20:13.5,p25:13.97,p30:14.49,p40:15.54,p60:18.39,p70:20.36,p75:21.51,p80:23.14,p90:27.8},
      {label:"30\u201339",median:21.26,mean:24.77,p10:13.51,p20:15.14,p25:15.98,p30:16.87,p40:18.99,p60:23.96,p70:27.38,p75:29.53,p80:32.0,p90:40.51},
      {label:"40\u201349",median:23.39,mean:28.05,p10:13.78,p20:15.73,p25:16.8,p30:18.0,p40:20.51,p60:26.68,p70:30.77,p75:33.56,p80:36.98,p90:47.92},
      {label:"50\u201359",median:22.64,mean:28.1,p10:13.53,p20:15.3,p25:16.23,p30:17.33,p40:19.67,p60:25.89,p70:30.22,p75:33.04,p80:36.77,p90:47.91},
      {label:"60+",median:19.25,mean:24.25,p10:12.99,p20:14.3,p25:14.95,p30:15.65,p40:17.29,p60:21.88,p70:25.39,p75:28.0,p80:30.7,p90:41.04},
    ],
    female_ft: [
      {label:"16\u201317",median:9.1,mean:10.72,p10:null,p20:7.56,p25:7.72,p30:8.18,p40:8.59,p60:9.79,p70:null,p75:null,p80:null,p90:null},
      {label:"18\u201321",median:12.83,mean:13.47,p10:10.48,p20:12.15,p25:12.21,p30:12.26,p40:12.55,p60:13.19,p70:13.77,p75:14.09,p80:14.62,p90:16.41},
      {label:"22\u201329",median:16.56,mean:18.39,p10:12.64,p20:13.42,p25:13.8,p30:14.28,p40:15.33,p60:18.14,p70:19.88,p75:20.97,p80:22.43,p90:26.64},
      {label:"30\u201339",median:20.33,mean:23.07,p10:13.2,p20:14.66,p25:15.48,p30:16.35,p40:18.28,p60:22.96,p70:25.65,p75:27.41,p80:29.32,p90:35.89},
      {label:"40\u201349",median:21.2,mean:24.96,p10:13.13,p20:14.53,p25:15.35,p30:16.33,p40:18.66,p60:24.43,p70:27.62,p75:29.49,p80:31.94,p90:41.04},
      {label:"50\u201359",median:19.71,mean:23.49,p10:12.94,p20:14.09,p25:14.81,p30:15.49,p40:17.27,p60:22.82,p70:25.88,p75:27.7,p80:30.12,p90:37.99},
      {label:"60+",median:16.79,mean:20.92,p10:12.58,p20:13.24,p25:13.7,p30:14.19,p40:15.35,p60:18.84,p70:21.69,p75:23.31,p80:25.41,p90:32.86},
    ],
  },
  hours: {
    all: [
      {label:"16\u201317",median:10.0,mean:13.2,p10:3.0,p20:4.1,p25:5.5,p30:6.5,p40:8.0,p60:12.8,p70:16.7,p75:16.7,p80:21.0,p90:30.0},
      {label:"18\u201321",median:23.8,mean:24.2,p10:5.6,p20:8.0,p25:11.4,p30:14.0,p40:18.0,p60:32.5,p70:37.4,p75:37.4,p80:39.0,p90:40.4},
      {label:"22\u201329",median:37.3,mean:34.3,p10:18.4,p20:29.1,p25:32.5,p30:35.0,p40:36.3,p60:37.8,p70:39.9,p75:39.9,p80:40.1,p90:42.3},
      {label:"30\u201339",median:37.0,mean:34.4,p10:19.5,p20:27.0,p25:32.4,p30:35.0,p40:36.0,p60:37.6,p70:39.9,p75:39.9,p80:40.1,p90:42.5},
      {label:"40\u201349",median:37.0,mean:34.0,p10:19.0,p20:25.6,p25:30.8,p30:34.3,p40:35.8,p60:37.5,p70:39.0,p75:39.0,p80:40.0,p90:42.2},
      {label:"50\u201359",median:36.9,mean:33.3,p10:17.2,p20:24.0,p25:29.9,p30:33.2,p40:35.5,p60:37.5,p70:38.7,p75:38.7,p80:39.6,p90:42.0},
      {label:"60+",median:33.8,mean:29.2,p10:10.0,p20:15.6,p25:19.7,p30:24.0,p40:30.0,p60:37.0,p70:37.5,p75:37.5,p80:39.0,p90:41.2},
    ],
    male: [
      {label:"16\u201317",median:11.2,mean:14.9,p10:2.6,p20:4.7,p25:5.7,p30:6.7,p40:8.7,p60:14.2,p70:19.8,p75:19.8,p80:28.3,p90:37.3},
      {label:"18\u201321",median:30.0,mean:26.9,p10:6.9,p20:10.0,p25:13.6,p30:17.5,p40:22.0,p60:37.5,p70:39.0,p75:39.0,p80:40.0,p90:42.5},
      {label:"22\u201329",median:37.5,mean:35.9,p10:21.2,p20:32.0,p25:35.0,p30:36.0,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:41.5,p90:44.2},
      {label:"30\u201339",median:37.5,mean:37.3,p10:30.0,p20:35.0,p25:35.0,p30:36.0,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:42.0,p90:45.0},
      {label:"40\u201349",median:37.5,mean:37.3,p10:30.0,p20:35.0,p25:35.0,p30:36.0,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:42.0,p90:45.0},
      {label:"50\u201359",median:37.5,mean:37.0,p10:27.5,p20:35.0,p25:35.0,p30:35.5,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:41.5,p90:45.0},
      {label:"60+",median:37.0,mean:33.2,p10:14.8,p20:23.0,p25:27.5,p30:32.5,p40:35.0,p60:38.0,p70:40.0,p75:40.0,p80:41.5,p90:44.3},
    ],
    female: [
      {label:"16\u201317",median:9.1,mean:11.7,p10:3.2,p20:4.0,p25:5.3,p30:6.3,p40:7.7,p60:11.3,p70:14.7,p75:14.7,p80:17.5,p90:23.4},
      {label:"18\u201321",median:19.7,mean:21.6,p10:4.8,p20:7.0,p25:9.8,p30:12.0,p40:15.7,p60:27.0,p70:34.9,p75:34.9,p80:37.5,p90:39.0},
      {label:"22\u201329",median:36.9,mean:32.8,p10:16.0,p20:25.0,p25:30.0,p30:33.0,p40:35.6,p60:37.5,p70:37.5,p75:37.5,p80:38.5,p90:40.0},
      {label:"30\u201339",median:35.0,mean:31.4,p10:16.0,p20:20.0,p25:25.0,p30:28.5,p40:33.0,p60:37.0,p70:37.5,p75:37.5,p80:38.5,p90:40.0},
      {label:"40\u201349",median:35.0,mean:30.8,p10:15.2,p20:19.3,p25:24.1,p30:26.5,p40:32.0,p60:37.0,p70:37.5,p75:37.5,p80:38.5,p90:40.0},
      {label:"50\u201359",median:34.0,mean:29.9,p10:14.0,p20:18.0,p25:22.5,p30:25.0,p40:30.0,p60:36.5,p70:37.4,p75:37.4,p80:37.5,p90:39.9},
      {label:"60+",median:25.0,mean:25.2,p10:8.3,p20:12.0,p25:15.6,p30:18.0,p40:21.0,p60:33.0,p70:36.0,p75:36.0,p80:37.0,p90:37.9},
    ],
    ft: [
      {label:"16\u201317",median:38.9,mean:39.7,p10:32.2,p20:35.0,p25:36.1,p30:37.0,p40:37.5,p60:40.0,p70:40.2,p75:40.2,p80:41.0,p90:null},
      {label:"18\u201321",median:37.7,mean:39.1,p10:33.1,p20:35.0,p25:36.0,p30:36.5,p40:37.0,p60:39.4,p70:40.2,p75:40.2,p80:42.0,p90:45.0},
      {label:"22\u201329",median:37.5,mean:38.6,p10:34.9,p20:35.5,p25:36.4,p30:36.6,p40:37.3,p60:38.5,p70:40.0,p75:40.0,p80:41.0,p90:43.5},
      {label:"30\u201339",median:37.5,mean:38.6,p10:34.5,p20:35.1,p25:36.0,p30:36.5,p40:37.2,p60:38.5,p70:40.0,p75:40.0,p80:41.5,p90:44.0},
      {label:"40\u201349",median:37.5,mean:38.4,p10:34.0,p20:35.0,p25:35.9,p30:36.3,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:41.0,p90:43.7},
      {label:"50\u201359",median:37.5,mean:38.4,p10:34.0,p20:35.0,p25:36.0,p30:36.3,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:41.3,p90:44.0},
      {label:"60+",median:37.5,mean:38.8,p10:33.9,p20:35.0,p25:36.0,p30:36.5,p40:37.0,p60:38.5,p70:40.0,p75:40.0,p80:41.5,p90:44.8},
    ],
    male_ft: [
      {label:"16\u201317",median:39.0,mean:39.8,p10:32.8,p20:36.0,p25:36.8,p30:37.5,p40:38.0,p60:40.0,p70:40.0,p75:40.0,p80:41.0,p90:null},
      {label:"18\u201321",median:39.0,mean:39.8,p10:34.5,p20:36.0,p25:36.9,p30:37.5,p40:38.0,p60:40.0,p70:41.2,p75:41.2,p80:43.5,p90:46.3},
      {label:"22\u201329",median:37.7,mean:39.3,p10:35.0,p20:36.0,p25:37.0,p30:37.0,p40:37.5,p60:39.0,p70:40.0,p75:40.0,p80:42.0,p90:45.0},
      {label:"30\u201339",median:37.5,mean:39.4,p10:35.0,p20:36.0,p25:36.9,p30:37.0,p40:37.5,p60:39.0,p70:40.0,p75:40.0,p80:42.5,p90:45.3},
      {label:"40\u201349",median:37.5,mean:39.4,p10:35.0,p20:36.0,p25:36.9,p30:37.0,p40:37.5,p60:39.0,p70:40.0,p75:40.0,p80:42.0,p90:45.0},
      {label:"50\u201359",median:37.5,mean:39.4,p10:35.0,p20:36.0,p25:36.9,p30:37.0,p40:37.5,p60:39.0,p70:40.0,p75:40.0,p80:42.0,p90:45.4},
      {label:"60+",median:37.9,mean:39.5,p10:35.0,p20:36.0,p25:36.9,p30:37.0,p40:37.5,p60:39.3,p70:40.5,p75:40.5,p80:42.5,p90:45.8},
    ],
    female_ft: [
      {label:"16\u201317",median:37.5,mean:39.7,p10:null,p20:33.0,p25:35.0,p30:35.5,p40:37.0,p60:38.5,p70:null,p75:null,p80:null,p90:null},
      {label:"18\u201321",median:37.5,mean:38.0,p10:32.2,p20:34.0,p25:35.0,p30:35.5,p40:36.8,p60:38.0,p70:40.0,p75:40.0,p80:40.0,p90:42.5},
      {label:"22\u201329",median:37.5,mean:37.7,p10:33.9,p20:35.0,p25:35.0,p30:36.0,p40:37.0,p60:37.5,p70:39.7,p75:39.7,p80:40.0,p90:41.1},
      {label:"30\u201339",median:37.4,mean:37.4,p10:32.5,p20:34.5,p25:35.0,p30:35.5,p40:36.5,p60:37.5,p70:38.6,p75:38.6,p80:39.0,p90:40.5},
      {label:"40\u201349",median:37.0,mean:37.2,p10:32.5,p20:34.0,p25:35.0,p30:35.0,p40:36.3,p60:37.5,p70:37.9,p75:37.9,p80:38.7,p90:40.4},
      {label:"50\u201359",median:37.0,mean:37.1,p10:32.5,p20:34.0,p25:35.0,p30:35.0,p40:36.0,p60:37.5,p70:37.5,p75:37.5,p80:38.0,p90:40.3},
      {label:"60+",median:37.0,mean:37.3,p10:32.2,p20:34.0,p25:35.0,p30:35.5,p40:36.5,p60:37.5,p70:37.9,p75:37.9,p80:38.5,p90:41.1},
    ],
  },
};



// Pay composition (mean weekly GBP): basic, overtime, other pay, annual incentive
const COMP = {
  all: [{basic:130.7,ot:3.8,other:0.9,inc:null},{basic:313.4,ot:10.4,other:5.6,inc:null},{basic:609.2,ot:12.7,other:13.5,inc:1255},{basic:777.9,ot:14.5,other:17.2,inc:2924},{basic:848.4,ot:15.3,other:16.4,inc:3383},{basic:806.2,ot:15.6,other:18.9,inc:3179},{basic:615.2,ot:13.1,other:12.0,inc:1882}],
  male: [{basic:148.0,ot:null,other:5.7,inc:null},{basic:354.5,ot:12.7,other:6.3,inc:null},{basic:647.9,ot:17.7,other:15.1,inc:1651},{basic:871.7,ot:21.9,other:21.8,inc:4059},{basic:988.4,ot:22.5,other:22.8,inc:4825},{basic:977.6,ot:23.8,other:28.2,inc:5353},{basic:754.2,ot:19.4,other:16.6,inc:2705}],
  female: [{basic:116.6,ot:3.3,other:0.6,inc:null},{basic:273.4,ot:8.1,other:4.9,inc:179},{basic:571.2,ot:7.9,other:11.6,inc:869},{basic:679.6,ot:6.8,other:12.2,inc:1781},{basic:713.7,ot:8.4,other:10.3,inc:2002},{basic:646.3,ot:8.0,other:10.2,inc:1153},{basic:474.8,ot:6.7,other:7.5,inc:null}],
  ft: [{basic:403.2,ot:null,other:10.2,inc:null},{basic:517.4,ot:11.5,other:9.5,inc:null},{basic:697.3,ot:13.3,other:15.6,inc:1523},{basic:893.1,ot:16.2,other:19.6,inc:3649},{basic:992.9,ot:17.3,other:19.5,inc:4318},{basic:966.8,ot:18.4,other:23.3,inc:4203},{basic:861.1,ot:18.1,other:17.1,inc:3174}],
  male_ft: [{basic:395.4,ot:null,other:12.7,inc:null},{basic:530.7,ot:15.5,other:9.7,inc:null},{basic:719.8,ot:18.6,other:17.1,inc:1892},{basic:930.1,ot:22.9,other:23.0,inc:4461},{basic:1056.8,ot:23.2,other:24.7,inc:5323},{basic:1052.5,ot:25.4,other:30.7,inc:5938},{basic:915.5,ot:23.0,other:20.6,inc:3573}],
  female_ft: [{basic:420.5,ot:null,other:4.6,inc:null},{basic:497.5,ot:5.5,other:9.0,inc:434},{basic:672.5,ot:7.4,other:13.9,inc:1115},{basic:840.6,ot:6.9,other:14.7,inc:2529},{basic:905.5,ot:9.2,other:12.5,inc:2951},{basic:848.9,ot:8.7,other:13.2,inc:1808},{basic:760.4,ot:9.1,other:10.8,inc:null}],
};

export default function EarningsDashboard() {
  const [analysisMode, setAnalysisMode] = useState("earnings");
  const [view, setView] = useState("age");
  const [period, setPeriod] = useState("annual");
  const [gender, setGender] = useState("all");
  const [work, setWork] = useState("all");
  const [userAge, setUserAge] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [selectedOccupationAgeBand, setSelectedOccupationAgeBand] = useState("");
  const [selectedOccupationDetail, setSelectedOccupationDetail] = useState("");
  const [occupationDetailData, setOccupationDetailData] = useState(null);
  const [occupationDetailStatus, setOccupationDetailStatus] = useState("idle");
  const [gapOccupationDetailData, setGapOccupationDetailData] = useState(null);
  const [gapOccupationDetailStatus, setGapOccupationDetailStatus] = useState("idle");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [annualPay, setAnnualPay] = useState("");
  const [weeklyPay, setWeeklyPay] = useState("");
  const [hourlyPay, setHourlyPay] = useState("");
  const [hoursPay, setHoursPay] = useState("");
  const [activeIdx, setActiveIdx] = useState(null);
  const containerRef = useRef(null);
  const cw = useContainerWidth(containerRef);

  const isMobile = cw < 520;
  const isTablet = cw >= 520 && cw < 768;
  const isDesktop = cw >= 768;
  const isGapMode = analysisMode === "gap";
  const isAgeView = view === "age";
  const isOccupationView = view === "occupation";
  const isIndustryView = view === "industry";
  const isRegionView = view === "region";
  const isSectorView = view === "sector";
  const effectivePeriod = isGapMode ? "hourly" : period;
  const effectiveGender = isGapMode ? "all" : gender;

  const earningsDataKey = useMemo(() => {
    if (effectiveGender === "all" && work === "all") return "all";
    if (effectiveGender === "all" && work === "ft") return "ft";
    if (effectiveGender === "male" && work === "all") return "male";
    if (effectiveGender === "female" && work === "all") return "female";
    if (effectiveGender === "male" && work === "ft") return "male_ft";
    if (effectiveGender === "female" && work === "ft") return "female_ft";
    return "all";
  }, [effectiveGender, work]);
  const gapDataKey = work === "ft" ? "ft" : "all";

  const usesOccupationAgeBand = isOccupationView && selectedOccupationAgeBand;

  useEffect(() => {
    let cancelled = false;

    if (
      isGapMode ||
      !isOccupationView ||
      usesOccupationAgeBand ||
      occupationDetailData ||
      occupationDetailStatus === "loading"
    ) {
      return undefined;
    }

    setOccupationDetailStatus("loading");

    import("./data/asheOccupationDetail")
      .then((module) => {
        if (cancelled) return;
        setOccupationDetailData(module.OCCUPATION_DETAIL_DATA);
        setOccupationDetailStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setOccupationDetailStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [
    isGapMode,
    isOccupationView,
    occupationDetailData,
    usesOccupationAgeBand,
  ]);

  const occupationDetailSeries = useMemo(() => {
    if (isGapMode || !(isOccupationView && selectedOccupation) || usesOccupationAgeBand || !occupationDetailData) return [];

    const periodData = occupationDetailData[effectivePeriod];
    if (!periodData) return [];
    const detailByCohort = periodData[earningsDataKey] || periodData.all;
    return detailByCohort?.[selectedOccupation] || [];
  }, [earningsDataKey, effectivePeriod, isGapMode, isOccupationView, occupationDetailData, selectedOccupation, usesOccupationAgeBand]);

  const occupationDetailOptions = useMemo(
    () => occupationDetailSeries.map(({ id, label }) => ({ id, label, shortLabel: id })),
    [occupationDetailSeries],
  );

  const usesOccupationDetail =
    !isGapMode &&
    isOccupationView &&
    !usesOccupationAgeBand &&
    !!selectedOccupation &&
    !!selectedOccupationDetail &&
    occupationDetailSeries.some(({ id }) => id === selectedOccupationDetail);

  useEffect(() => {
    let cancelled = false;

    if (
      !isGapMode ||
      !isOccupationView ||
      usesOccupationAgeBand ||
      gapOccupationDetailData ||
      gapOccupationDetailStatus === "loading"
    ) {
      return undefined;
    }

    setGapOccupationDetailStatus("loading");

    import("./data/asheGenderGapDetail")
      .then((module) => {
        if (cancelled) return;
        setGapOccupationDetailData(module.OCCUPATION_DETAIL_GAP_DATA);
        setGapOccupationDetailStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setGapOccupationDetailStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [
    gapOccupationDetailData,
    isGapMode,
    isOccupationView,
    usesOccupationAgeBand,
  ]);

  const gapOccupationDetailSeries = useMemo(() => {
    if (!isGapMode || !(isOccupationView && selectedOccupation) || usesOccupationAgeBand || !gapOccupationDetailData) return [];
    return gapOccupationDetailData[gapDataKey]?.[selectedOccupation] || [];
  }, [gapDataKey, gapOccupationDetailData, isGapMode, isOccupationView, selectedOccupation, usesOccupationAgeBand]);

  const gapOccupationDetailOptions = useMemo(
    () => gapOccupationDetailSeries.map(({ id, label }) => ({ id, label, shortLabel: id })),
    [gapOccupationDetailSeries],
  );

  const usesGapOccupationDetail =
    isGapMode &&
    isOccupationView &&
    !usesOccupationAgeBand &&
    !!selectedOccupation &&
    !!selectedOccupationDetail &&
    gapOccupationDetailSeries.some(({ id }) => id === selectedOccupationDetail);

  useEffect(() => {
    if (!isOccupationView || usesOccupationAgeBand || !selectedOccupation) {
      setSelectedOccupationDetail("");
      return;
    }

    const currentSeries = isGapMode ? gapOccupationDetailSeries : occupationDetailSeries;
    if (selectedOccupationDetail && !currentSeries.some(({ id }) => id === selectedOccupationDetail)) {
      setSelectedOccupationDetail("");
    }
  }, [
    gapOccupationDetailSeries,
    isGapMode,
    isOccupationView,
    occupationDetailSeries,
    selectedOccupation,
    selectedOccupationDetail,
    usesOccupationAgeBand,
  ]);

  const viewConfig = isOccupationView
    ? {
        selectorLabel: "Occupation group",
        selectorKind: "occupation group",
        selectorOptions: OCCUPATION_OPTIONS,
        selectorValue: selectedOccupation,
        setSelectorValue: setSelectedOccupation,
        selectorNote: isGapMode
          ? gapOccupationDetailStatus === "loading"
            ? "Loading official ONS Table 14 gender pay gap detail."
            : selectedOccupationDetail
              ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 14."
              : selectedOccupationAgeBand
                ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 20."
                : "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 2."
          : occupationDetailStatus === "loading"
            ? "Loading official ONS Table 14 job detail."
            : selectedOccupationDetail
              ? "Detailed occupation view uses official ONS 4-digit SOC job data from ASHE Table 14."
              : selectedOccupationAgeBand
                ? "Occupation view uses official ONS SOC20 major occupation groups with age-band refinement from ASHE Table 20. Four-digit job detail is only published here for all ages."
                : "Occupation view uses official ONS SOC20 major occupation groups from ASHE Table 2, with optional 4-digit drill-down from Table 14.",
      }
    : isIndustryView
      ? {
          selectorLabel: "Industry section",
          selectorKind: "industry section",
          selectorOptions: INDUSTRY_OPTIONS,
          selectorValue: selectedIndustry,
          setSelectorValue: setSelectedIndustry,
          selectorNote: isGapMode
            ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 4."
            : "Industry view uses official ONS SIC2007 section groupings from ASHE Table 4.",
        }
      : isRegionView
        ? {
            selectorLabel: "Region",
            selectorKind: "region",
            selectorOptions: REGION_OPTIONS,
            selectorValue: selectedRegion,
            setSelectorValue: setSelectedRegion,
            selectorNote: isGapMode
              ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 15."
              : "Region view uses official ONS UK workplace regions from ASHE Table 15.",
          }
        : isSectorView
          ? {
              selectorLabel: "Sector",
              selectorKind: "sector",
              selectorOptions: SECTOR_OPTIONS,
              selectorValue: selectedSector,
              setSelectorValue: setSelectedSector,
              selectorNote: isGapMode
                ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 13."
                : "Sector view uses official ONS public, private, non-profit, and unclassified groups from ASHE Table 13.",
            }
          : null;

  const sourceData = !isGapMode
    ? usesOccupationAgeBand
      ? AGE_OCCUPATION_DATA
      : isOccupationView
        ? OCCUPATION_DATA
        : isIndustryView
          ? INDUSTRY_DATA
          : isRegionView
            ? REGION_DATA
            : isSectorView
              ? SECTOR_DATA
              : DATA
    : null;

  const gapData = isGapMode
    ? usesOccupationAgeBand
      ? AGE_OCCUPATION_GAP_DATA[gapDataKey]?.[selectedOccupationAgeBand] || []
      : usesGapOccupationDetail
        ? gapOccupationDetailSeries
        : isOccupationView
          ? OCCUPATION_GAP_DATA[gapDataKey] || []
          : isIndustryView
            ? INDUSTRY_GAP_DATA[gapDataKey] || []
            : isRegionView
              ? REGION_GAP_DATA[gapDataKey] || []
              : isSectorView
                ? SECTOR_GAP_DATA[gapDataKey] || []
                : AGE_GAP_DATA[gapDataKey] || []
    : [];

  const data = isGapMode
    ? gapData
    : usesOccupationAgeBand
      ? sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationAgeBand] || []
      : usesOccupationDetail
        ? occupationDetailSeries
        : sourceData[effectivePeriod][earningsDataKey] || sourceData[effectivePeriod].all;

  const isWeekly = effectivePeriod === "weekly";
  const isHourly = effectivePeriod === "hourly";
  const isHours = effectivePeriod === "hours";

  const rawAge = parseInt(userAge, 10);
  const age = !isNaN(rawAge) && rawAge >= 16 ? rawAge : null;
  const userSalary = isHours ? hoursPay : isHourly ? hourlyPay : isWeekly ? weeklyPay : annualPay;
  const setUserSalary = isHours ? setHoursPay : isHourly ? setHourlyPay : isWeekly ? setWeeklyPay : setAnnualPay;
  const salary = parseFloat(String(userSalary).replace(/[\u00a3,\s]/g, "")) || null;
  const ageGroupLabel = age ? findGroup(age) : null;
  const selectedBucketId = isOccupationView
    ? usesOccupationDetail || usesGapOccupationDetail
      ? selectedOccupationDetail || null
      : selectedOccupation || null
    : isIndustryView
      ? selectedIndustry || null
      : isRegionView
        ? selectedRegion || null
        : isSectorView
          ? selectedSector || null
          : ageGroupLabel;
  const selectedBucket = data.find((row) => (row.id ?? row.label) === selectedBucketId);
  const selectedLabel = selectedBucket?.label ?? null;
  const pctResult = !isGapMode && selectedBucket && salary ? estimatePercentile(selectedBucket, salary) : null;
  const ageGroupIdx = data.findIndex((row) => row.label === ageGroupLabel);
  const compData = !isGapMode && isAgeView && COMP[earningsDataKey] && ageGroupIdx >= 0 ? COMP[earningsDataKey][ageGroupIdx] : null;
  const availableKeys = useMemo(() => PK.filter((key) => data.some((row) => row[key] != null)), [data]);

  const handleColumnInteract = useCallback((i) => {
    setActiveIdx((prev) => (prev === i ? null : i));
  }, []);

  const fmtGrid = (v) => {
    if (v === 0) return isHours ? "0h" : "£0";
    if (isHours) return `${v}h`;
    if (isHourly) return `£${v}`;
    if (isWeekly) return isMobile && v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${v}`;
    return `£${(v / 1000).toFixed(0)}k`;
  };

  const fmt = (v) => {
    if (v == null) return "\u2014";
    if (isHours) return `${Number.isInteger(v) ? v : v.toFixed(1)}h`;
    if (isHourly) return `£${v.toFixed(2)}`;
    return `£${v.toLocaleString("en-GB")}`;
  };

  const fmtRate = (value) => (value == null ? "—" : `£${Number(value).toFixed(1)}`);

  const genderLabel = { all: "all employees", male: "male employees", female: "female employees" }[effectiveGender] || "employees";
  const workLabel = { all: "", ft: " (full-time)", pt: " (part-time)" }[work] || "";
  const cohortDesc = `${genderLabel}${workLabel}`;
  const gapWorkLabel = work === "ft" ? "full-time employees" : "all employees";
  const occupationAgeBandLabel = selectedOccupationAgeBand || null;
  const periodLabel = isGapMode ? "hourly pay excluding overtime" : isHours ? "weekly hours" : isHourly ? "hourly" : isWeekly ? "weekly" : "annual";
  const periodUnit = isHours ? "/wk" : isHourly ? "/hr" : isWeekly ? "/week" : "/year";
  const payPromptLabel = isGapMode ? "official gender pay gap" : isHours ? "weekly hours" : isHourly ? "hourly rate" : isWeekly ? "weekly pay" : "annual salary";
  const emptyPrompt = isGapMode
    ? isAgeView
      ? "Enter your age to highlight the official gender pay gap for your age group."
      : `Choose a ${viewConfig.selectorKind} to explore the official gender pay gap.`
    : isAgeView
      ? `Enter your age and ${payPromptLabel} above to see where you fall.`
      : `Choose a ${viewConfig.selectorKind} and enter your ${payPromptLabel} above to see where you fall.`;
  const percentileContext = isAgeView
    ? "in your age bracket."
    : isIndustryView
      ? "in this industry."
      : isRegionView
        ? "in this region."
        : isSectorView
          ? "in this sector."
          : usesOccupationDetail
            ? "in this job detail."
            : usesOccupationAgeBand
              ? "in this age band and occupation group."
              : "in this occupation group.";
  const insightCohortDesc = usesOccupationAgeBand ? `${cohortDesc} aged ${occupationAgeBandLabel}` : cohortDesc;
  const gapBenchmark = GAP_BENCHMARKS[gapDataKey];
  const currentOccupationDetailOptions = isGapMode ? gapOccupationDetailOptions : occupationDetailOptions;
  const currentOccupationDetailStatus = isGapMode ? gapOccupationDetailStatus : occupationDetailStatus;

  const comboAvailable = isGapMode
    ? data.length > 0
    : usesOccupationAgeBand
      ? !!sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationAgeBand]
      : !!sourceData[effectivePeriod][earningsDataKey];

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        padding: isMobile ? "20px 10px" : "32px 20px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: C.text,
      }}
    >
      <div ref={containerRef} style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 20 : 26,
            fontWeight: 600,
            color: "#f5f0e8",
            margin: "0 0 4px",
          }}
        >
          UK Earnings Explorer
        </h1>
        <p style={{ color: C.muted, fontSize: isMobile ? 11 : 13, margin: "0 0 20px" }}>
          ASHE 2025 Provisional · Office for National Statistics
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 10 : 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pay period</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <Pill active={!isGapMode && period === "annual"} disabled={isGapMode} onClick={() => setPeriod("annual")} isMobile={isMobile}>Annual</Pill>
              <Pill active={!isGapMode && period === "weekly"} disabled={isGapMode} onClick={() => setPeriod("weekly")} isMobile={isMobile}>Weekly</Pill>
              <Pill active={effectivePeriod === "hourly"} disabled={isGapMode} onClick={() => setPeriod("hourly")} isMobile={isMobile}>Hourly</Pill>
              <Pill active={!isGapMode && period === "hours"} disabled={isGapMode} onClick={() => setPeriod("hours")} isMobile={isMobile}>Hours</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gender</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={effectiveGender === "all"} disabled={isGapMode} onClick={() => setGender("all")} isMobile={isMobile}>All</Pill>
              <Pill active={!isGapMode && gender === "male"} disabled={isGapMode} onClick={() => setGender("male")} isMobile={isMobile}>Male</Pill>
              <Pill active={!isGapMode && gender === "female"} disabled={isGapMode} onClick={() => setGender("female")} isMobile={isMobile}>Female</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Work pattern</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={work === "all"} onClick={() => setWork("all")} isMobile={isMobile}>All</Pill>
              <Pill active={work === "ft"} onClick={() => setWork("ft")} isMobile={isMobile}>Full-Time</Pill>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Analysis</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Pill active={analysisMode === "earnings"} onClick={() => setAnalysisMode("earnings")} isMobile={isMobile}>Earnings</Pill>
            <Pill active={analysisMode === "gap"} onClick={() => setAnalysisMode("gap")} isMobile={isMobile}>Gender pay gap</Pill>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>View</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Pill active={view === "age"} onClick={() => setView("age")} isMobile={isMobile}>Age</Pill>
            <Pill active={view === "occupation"} onClick={() => setView("occupation")} isMobile={isMobile}>Occupation</Pill>
            <Pill active={view === "industry"} onClick={() => setView("industry")} isMobile={isMobile}>Industry</Pill>
            <Pill active={view === "region"} onClick={() => setView("region")} isMobile={isMobile}>Region</Pill>
            <Pill active={view === "sector"} onClick={() => setView("sector")} isMobile={isMobile}>Sector</Pill>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: !isAgeView || isGapMode ? 8 : 20,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {isAgeView ? (
            <div style={{ width: isMobile ? "35%" : 60, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Your age</label>
              <input
                type="number"
                min="16"
                max="80"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${C.faint}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : (
            <div style={{ width: isMobile ? "100%" : isOccupationView ? 320 : 260, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>{viewConfig.selectorLabel}</label>
              <select
                value={viewConfig.selectorValue}
                onChange={(e) => viewConfig.setSelectorValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${C.faint}`,
                  background: C.card,
                  color: viewConfig.selectorValue ? C.text : C.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">Select one</option>
                {viewConfig.selectorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isOccupationView && (
            <div style={{ width: isMobile ? "calc(42% - 5px)" : 126, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Age band</label>
              <select
                value={selectedOccupationAgeBand}
                onChange={(e) => setSelectedOccupationAgeBand(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${C.faint}`,
                  background: C.card,
                  color: selectedOccupationAgeBand ? C.text : C.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">All ages</option>
                {OCCUPATION_AGE_BANDS.map((ageBand) => (
                  <option key={ageBand} value={ageBand}>
                    {ageBand}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isOccupationView && selectedOccupation && (
            <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Job detail</label>
              <select
                value={selectedOccupationDetail}
                onChange={(e) => setSelectedOccupationDetail(e.target.value)}
                disabled={selectedOccupationAgeBand || currentOccupationDetailStatus === "loading" || currentOccupationDetailStatus === "error"}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${C.faint}`,
                  background: C.card,
                  color: selectedOccupationDetail ? C.text : C.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  opacity: selectedOccupationAgeBand || currentOccupationDetailStatus === "loading" || currentOccupationDetailStatus === "error" ? 0.65 : 1,
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">
                  {selectedOccupationAgeBand
                    ? "Unavailable with age band"
                    : currentOccupationDetailStatus === "loading"
                    ? "Loading job details..."
                    : currentOccupationDetailStatus === "error"
                      ? "Job detail unavailable"
                      : "All job details"}
                </option>
                {currentOccupationDetailOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isGapMode && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>
                {isHours ? "Hours per week" : isHourly ? "Hourly rate (£)" : isWeekly ? "Weekly gross pay (£)" : "Annual salary (£)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={userSalary}
                onChange={(e) => setUserSalary(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${C.faint}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {(!isAgeView || isGapMode) && (
          <p style={{ color: C.dim, fontSize: isMobile ? 10 : 11, margin: "0 0 20px" }}>
            {isGapMode
              ? `Official mode: this always uses hourly pay excluding overtime. ${viewConfig?.selectorNote ?? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 6."}`
              : viewConfig.selectorNote}
          </p>
        )}

        {!comboAvailable && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: 12,
              borderRadius: 8,
              background: `${C.red}15`,
              border: `1px solid ${C.red}30`,
              color: C.muted,
              fontSize: 12,
            }}
          >
            This combination isn't published by ONS. Showing closest available data.
          </div>
        )}

        {isGapMode ? (
          <>
            <GenderGapChart
              activeIdx={activeIdx}
              containerWidth={cw}
              data={data}
              fmtRate={fmtRate}
              handleColumnInteract={handleColumnInteract}
              isMobile={isMobile}
              isTablet={isTablet}
              selectedBucketId={selectedBucketId}
              setActiveIdx={setActiveIdx}
            />
            <GenderGapCard
              benchmark={gapBenchmark}
              emptyPrompt={emptyPrompt}
              isMobile={isMobile}
              selectedBucket={selectedBucket}
              selectedLabel={selectedLabel}
              workLabel={gapWorkLabel}
            />
          </>
        ) : (
          <>
            <EarningsChart
              activeIdx={activeIdx}
              availableKeys={availableKeys}
              containerWidth={cw}
              data={data}
              fmt={fmt}
              fmtGrid={fmtGrid}
              handleColumnInteract={handleColumnInteract}
              isHours={isHours}
              isHourly={isHourly}
              isMobile={isMobile}
              isTablet={isTablet}
              isWeekly={isWeekly}
              salary={salary}
              selectedBucketId={selectedBucketId}
              setActiveIdx={setActiveIdx}
            />
            <InsightCard
              age={age}
              availableKeys={availableKeys}
              cohortDesc={insightCohortDesc}
              compData={compData}
              emptyPrompt={emptyPrompt}
              fmt={fmt}
              hoursPay={hoursPay}
              isHours={isHours}
              isHourly={isHourly}
              isMobile={isMobile}
              isTablet={isTablet}
              isWeekly={isWeekly}
              periodLabel={periodLabel}
              periodUnit={periodUnit}
              pctResult={pctResult}
              percentileContext={percentileContext}
              salary={salary}
              selectedBucket={selectedBucket}
              selectedLabel={selectedLabel}
              selectionType={view}
            />
          </>
        )}

        <p style={{ fontSize: isMobile ? 9 : 10, color: "#3a3830", marginTop: 16, lineHeight: 1.5 }}>
          Source: ONS Annual Survey of Hours and Earnings (ASHE) 2025 Provisional. Employees on adult rates in same job for &gt;1 year.
          {isGapMode
            ? ` Gender pay gap mode uses the official ONS formula based on hourly pay excluding overtime.${work === "ft" ? " The current UK full-time benchmark is 6.9%." : " The current UK all-employee benchmark is 12.8%."}`
            : `${isOccupationView ? ` Occupation view uses SOC20 major groups${usesOccupationAgeBand ? " with Table 20 age-band refinement" : usesOccupationDetail ? " with Table 14 four-digit job detail" : ""}.` : ""}${isIndustryView ? " Industry view uses SIC2007 section groupings." : ""}${isRegionView ? " Region view uses workplace regions." : ""}${isSectorView ? " Sector view uses public, private, and non-profit groupings." : ""}`}
          {!isGapMode && usesOccupationDetail && " The x-axis uses 4-digit SOC codes to keep detailed charts readable."}
          {isDesktop && ` Hover ${isGapMode ? "categories" : "columns"} for detail.`}
        </p>
      </div>
    </div>
  );
}
