/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normaliseBall } from "../src/lib/scoring";

const prisma = new PrismaClient();

const TEAMS: {
  name: string;
  shortName: string;
  captain: string;
  group: "Group A" | "Group B";
  players: { name: string; role: "BATTER" | "BOWLER" | "ALLROUNDER" | "WICKETKEEPER" }[];
}[] = [
  {
    name: "Dhaka Dynamos",
    shortName: "DHK",
    captain: "Nayeem Hasan",
    group: "Group A",
    players: [
      { name: "Sabbir Khan", role: "BATTER" },
      { name: "Rafiq Ullah", role: "BATTER" },
      { name: "Arif Chowdhury", role: "BATTER" },
      { name: "Nayeem Hasan", role: "ALLROUNDER" },
      { name: "Imran Ali", role: "ALLROUNDER" },
      { name: "Tariq Aziz", role: "WICKETKEEPER" },
      { name: "Mahmud Khan", role: "BOWLER" },
      { name: "Shariar Islam", role: "BOWLER" },
      { name: "Rubel Hasan", role: "BOWLER" },
      { name: "Saif Uddin", role: "ALLROUNDER" },
      { name: "Kamrul Nabi", role: "BOWLER" },
    ],
  },
  {
    name: "Chittagong Chargers",
    shortName: "CTG",
    captain: "Mushfiq Rahman",
    group: "Group A",
    players: [
      { name: "Mushfiq Rahman", role: "WICKETKEEPER" },
      { name: "Liton Datta", role: "BATTER" },
      { name: "Anamul Haque", role: "BATTER" },
      { name: "Yasin Arafat", role: "BATTER" },
      { name: "Sohel Rana", role: "ALLROUNDER" },
      { name: "Nasum Ahmed", role: "BOWLER" },
      { name: "Taskin Jamil", role: "BOWLER" },
      { name: "Ebadot Hasan", role: "BOWLER" },
      { name: "Mehedi Hasan", role: "ALLROUNDER" },
      { name: "Mominul Haq", role: "BATTER" },
      { name: "Abu Jayed", role: "BOWLER" },
    ],
  },
  {
    name: "Khulna Kings",
    shortName: "KHU",
    captain: "Tamim Iqbal",
    group: "Group A",
    players: [
      { name: "Tamim Iqbal", role: "BATTER" },
      { name: "Soumya Sarkar", role: "ALLROUNDER" },
      { name: "Mohammad Mithun", role: "BATTER" },
      { name: "Afif Hossain", role: "BATTER" },
      { name: "Mahmudullah Riyadh", role: "ALLROUNDER" },
      { name: "Nurul Hasan", role: "WICKETKEEPER" },
      { name: "Shafiul Islam", role: "BOWLER" },
      { name: "Al-Amin Hossain", role: "BOWLER" },
      { name: "Taijul Islam", role: "BOWLER" },
      { name: "Shakib Al", role: "ALLROUNDER" },
      { name: "Shahadat Hossain", role: "BOWLER" },
    ],
  },
  {
    name: "Sylhet Strikers",
    shortName: "SYL",
    captain: "Mashrafe Mortaza",
    group: "Group A",
    players: [
      { name: "Mashrafe Mortaza", role: "BOWLER" },
      { name: "Imrul Kayes", role: "BATTER" },
      { name: "Mohammad Naim", role: "BATTER" },
      { name: "Najmul Hossain", role: "BATTER" },
      { name: "Mosaddek Hossain", role: "ALLROUNDER" },
      { name: "Ziaur Rahman", role: "ALLROUNDER" },
      { name: "Enamul Haque", role: "BOWLER" },
      { name: "Rony Talukdar", role: "BATTER" },
      { name: "Shuvagata Hom", role: "ALLROUNDER" },
      { name: "Mohammad Saifuddin", role: "ALLROUNDER" },
      { name: "Jubair Hossain", role: "BOWLER" },
    ],
  },
  {
    name: "Rajshahi Royals",
    shortName: "RAJ",
    captain: "Andre Russell",
    group: "Group B",
    players: [
      { name: "Andre Russell", role: "ALLROUNDER" },
      { name: "Shoaib Malik", role: "ALLROUNDER" },
      { name: "Mohammad Hafeez", role: "ALLROUNDER" },
      { name: "Babar Azam", role: "BATTER" },
      { name: "Fakhar Zaman", role: "BATTER" },
      { name: "Asif Ali", role: "BATTER" },
      { name: "Hasan Ali", role: "BOWLER" },
      { name: "Shaheen Afridi", role: "BOWLER" },
      { name: "Shadab Khan", role: "ALLROUNDER" },
      { name: "Sarfaraz Ahmed", role: "WICKETKEEPER" },
      { name: "Mohammad Amir", role: "BOWLER" },
    ],
  },
  {
    name: "Barisal Bulls",
    shortName: "BAR",
    captain: "Chris Gayle",
    group: "Group B",
    players: [
      { name: "Chris Gayle", role: "BATTER" },
      { name: "Kieron Pollard", role: "ALLROUNDER" },
      { name: "Dwayne Bravo", role: "ALLROUNDER" },
      { name: "Sunil Narine", role: "ALLROUNDER" },
      { name: "Nicholas Pooran", role: "WICKETKEEPER" },
      { name: "Shimron Hetmyer", role: "BATTER" },
      { name: "Jason Holder", role: "ALLROUNDER" },
      { name: "Alzarri Joseph", role: "BOWLER" },
      { name: "Sheldon Cottrell", role: "BOWLER" },
      { name: "Oshane Thomas", role: "BOWLER" },
      { name: "Lendl Simmons", role: "BATTER" },
    ],
  },
  {
    name: "Rangpur Riders",
    shortName: "RAN",
    captain: "Jason Roy",
    group: "Group B",
    players: [
      { name: "Jason Roy", role: "BATTER" },
      { name: "Alex Hales", role: "BATTER" },
      { name: "Joe Root", role: "BATTER" },
      { name: "Eoin Morgan", role: "BATTER" },
      { name: "Jos Buttler", role: "WICKETKEEPER" },
      { name: "Ben Stokes", role: "ALLROUNDER" },
      { name: "Moeen Ali", role: "ALLROUNDER" },
      { name: "Adil Rashid", role: "BOWLER" },
      { name: "Chris Jordan", role: "BOWLER" },
      { name: "Jofra Archer", role: "BOWLER" },
      { name: "Mark Wood", role: "BOWLER" },
    ],
  },
  {
    name: "Comilla Cyclones",
    shortName: "COM",
    captain: "David Warner",
    group: "Group B",
    players: [
      { name: "David Warner", role: "BATTER" },
      { name: "Aaron Finch", role: "BATTER" },
      { name: "Steve Smith", role: "BATTER" },
      { name: "Glenn Maxwell", role: "ALLROUNDER" },
      { name: "Marcus Stoinis", role: "ALLROUNDER" },
      { name: "Matthew Wade", role: "WICKETKEEPER" },
      { name: "Ashton Agar", role: "ALLROUNDER" },
      { name: "Pat Cummins", role: "BOWLER" },
      { name: "Mitchell Starc", role: "BOWLER" },
      { name: "Josh Hazlewood", role: "BOWLER" },
      { name: "Adam Zampa", role: "BOWLER" },
    ],
  },
];

const VENUES = [
  { name: "Sher-e-Bangla National Stadium", city: "Dhaka", capacity: 25000 },
  { name: "Zahur Ahmed Chowdhury Stadium", city: "Chittagong", capacity: 22000 },
  { name: "Sylhet International Stadium", city: "Sylhet", capacity: 18000 },
  { name: "Khulna Divisional Stadium", city: "Khulna", capacity: 15000 },
];

async function main() {
  console.log("Seeding NPL Cricket Tournament…");

  // Wipe existing data (dev only)
  await prisma.ballEvent.deleteMany();
  await prisma.fallOfWicket.deleteMany();
  await prisma.batterCard.deleteMany();
  await prisma.bowlerCard.deleteMany();
  await prisma.innings.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.group.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // Users
  await prisma.user.create({
    data: {
      username: "admin",
      name: "Tournament Admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });
  const scorer1 = await prisma.user.create({
    data: {
      username: "scorer1",
      name: "Match Scorer 1",
      passwordHash: await bcrypt.hash("scorer123", 10),
      role: "SCORER",
    },
  });
  await prisma.user.create({
    data: {
      username: "scorer2",
      name: "Match Scorer 2",
      passwordHash: await bcrypt.hash("scorer123", 10),
      role: "SCORER",
    },
  });

  // Groups
  const groupA = await prisma.group.create({ data: { name: "Group A" } });
  const groupB = await prisma.group.create({ data: { name: "Group B" } });
  const groups = { "Group A": groupA, "Group B": groupB };

  // Venues
  const venueRecords: any[] = [];
  for (const v of VENUES) venueRecords.push(await prisma.venue.create({ data: v }));

  // Teams + players
  const teamRecords: Record<string, any> = {};
  for (const t of TEAMS) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        shortName: t.shortName,
        captain: t.captain,
        groupId: groups[t.group].id,
      },
    });
    teamRecords[t.shortName] = team;
    for (const p of t.players) {
      await prisma.player.create({ data: { name: p.name, role: p.role, teamId: team.id } });
    }
  }

  // Fixtures
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const fixtureConfigs: {
    a: string;
    b: string;
    venue: number;
    group: string;
    offsetDays: number;
    hour: number;
    overs?: number;
    scorerId?: string;
  }[] = [
    // Completed matches (in the past)
    { a: "DHK", b: "CTG", venue: 0, group: "Group A", offsetDays: -7, hour: 15 },
    { a: "KHU", b: "SYL", venue: 3, group: "Group A", offsetDays: -6, hour: 15 },
    { a: "RAJ", b: "BAR", venue: 0, group: "Group B", offsetDays: -5, hour: 19 },
    { a: "RAN", b: "COM", venue: 1, group: "Group B", offsetDays: -4, hour: 19 },
    { a: "DHK", b: "KHU", venue: 0, group: "Group A", offsetDays: -3, hour: 19 },
    { a: "CTG", b: "SYL", venue: 1, group: "Group A", offsetDays: -2, hour: 19 },

    // Live match (today) — assigned to scorer1
    {
      a: "RAJ",
      b: "RAN",
      venue: 0,
      group: "Group B",
      offsetDays: 0,
      hour: new Date().getHours() - 1 >= 0 ? new Date().getHours() - 1 : 0,
      scorerId: scorer1.id,
    },

    // Upcoming (future)
    { a: "BAR", b: "COM", venue: 1, group: "Group B", offsetDays: 1, hour: 19, scorerId: scorer1.id },
    { a: "SYL", b: "DHK", venue: 2, group: "Group A", offsetDays: 2, hour: 19 },
    { a: "KHU", b: "CTG", venue: 3, group: "Group A", offsetDays: 3, hour: 19 },
    { a: "RAN", b: "RAJ", venue: 0, group: "Group B", offsetDays: 4, hour: 19 },
    { a: "COM", b: "BAR", venue: 1, group: "Group B", offsetDays: 5, hour: 19 },
  ];

  let matchNumber = 1;
  const createdMatches: any[] = [];
  for (const f of fixtureConfigs) {
    const sched = new Date(now);
    sched.setDate(sched.getDate() + f.offsetDays);
    sched.setHours(f.hour, 0, 0, 0);
    const m = await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        groupName: f.group,
        teamAId: teamRecords[f.a].id,
        teamBId: teamRecords[f.b].id,
        venueId: venueRecords[f.venue].id,
        scheduledAt: sched,
        overs: f.overs ?? 20,
        scorerId: f.scorerId ?? null,
      },
    });
    createdMatches.push(m);
  }

  // Simulate completed matches with simple scripted outcomes to populate points table
  const completedResults: {
    matchIdx: number;
    firstBatShort: string;
    firstScore: { runs: number; wickets: number; legalBalls: number };
    secondScore: { runs: number; wickets: number; legalBalls: number };
  }[] = [
    {
      matchIdx: 0, // DHK vs CTG, DHK bat first, win by 25 runs
      firstBatShort: "DHK",
      firstScore: { runs: 180, wickets: 6, legalBalls: 120 },
      secondScore: { runs: 155, wickets: 9, legalBalls: 120 },
    },
    {
      matchIdx: 1, // KHU vs SYL, KHU bat first, lose by 3 wickets
      firstBatShort: "KHU",
      firstScore: { runs: 160, wickets: 8, legalBalls: 120 },
      secondScore: { runs: 161, wickets: 7, legalBalls: 114 },
    },
    {
      matchIdx: 2, // RAJ vs BAR, RAJ bat first, win by 7 wickets? no, team-chasing wins
      firstBatShort: "BAR",
      firstScore: { runs: 140, wickets: 10, legalBalls: 108 }, // all out; full overs count for NRR
      secondScore: { runs: 141, wickets: 3, legalBalls: 102 },
    },
    {
      matchIdx: 3, // RAN vs COM tied
      firstBatShort: "RAN",
      firstScore: { runs: 175, wickets: 7, legalBalls: 120 },
      secondScore: { runs: 175, wickets: 9, legalBalls: 120 },
    },
    {
      matchIdx: 4, // DHK vs KHU, KHU win by 15 runs
      firstBatShort: "KHU",
      firstScore: { runs: 170, wickets: 6, legalBalls: 120 },
      secondScore: { runs: 155, wickets: 10, legalBalls: 115 },
    },
    {
      matchIdx: 5, // CTG vs SYL, CTG win by 5 wickets
      firstBatShort: "SYL",
      firstScore: { runs: 145, wickets: 9, legalBalls: 120 },
      secondScore: { runs: 146, wickets: 5, legalBalls: 116 },
    },
  ];

  for (const r of completedResults) {
    const m = createdMatches[r.matchIdx];
    const firstBatTeamId = teamRecords[r.firstBatShort].id;
    const firstBowlTeamId =
      firstBatTeamId === m.teamAId ? m.teamBId : m.teamAId;

    const inn1 = await prisma.innings.create({
      data: {
        matchId: m.id,
        inningsNumber: 1,
        battingTeamId: firstBatTeamId,
        bowlingTeamId: firstBowlTeamId,
        runs: r.firstScore.runs,
        wickets: r.firstScore.wickets,
        legalBalls: r.firstScore.legalBalls,
        isClosed: true,
      },
    });
    const inn2 = await prisma.innings.create({
      data: {
        matchId: m.id,
        inningsNumber: 2,
        battingTeamId: firstBowlTeamId,
        bowlingTeamId: firstBatTeamId,
        runs: r.secondScore.runs,
        wickets: r.secondScore.wickets,
        legalBalls: r.secondScore.legalBalls,
        target: r.firstScore.runs + 1,
        isClosed: true,
      },
    });
    // Determine winner & result text
    let winnerId: string | null = null;
    let resultText = "No Result";
    if (inn2.runs > inn1.runs) {
      winnerId = inn2.battingTeamId;
      const wicketsInHand = 10 - inn2.wickets;
      const name = (await prisma.team.findUnique({ where: { id: winnerId } }))!.name;
      resultText = `${name} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
    } else if (inn2.runs < inn1.runs) {
      winnerId = inn1.battingTeamId;
      const margin = inn1.runs - inn2.runs;
      const name = (await prisma.team.findUnique({ where: { id: winnerId } }))!.name;
      resultText = `${name} won by ${margin} run${margin === 1 ? "" : "s"}`;
    } else {
      resultText = "Match Tied";
    }
    await prisma.match.update({
      where: { id: m.id },
      data: {
        status: "COMPLETED",
        winnerId,
        resultText,
        tossWinnerId: firstBatTeamId,
        tossDecision: "BAT",
        currentInningsNumber: 2,
      },
    });
  }

  // Start the "live" match (index 6 in fixtureConfigs) with a partial innings
  {
    const liveMatch = createdMatches[6]; // RAJ vs RAN
    await prisma.match.update({
      where: { id: liveMatch.id },
      data: {
        status: "LIVE",
        tossWinnerId: teamRecords.RAJ.id,
        tossDecision: "BAT",
        currentInningsNumber: 1,
      },
    });
    // Build a first innings with a handful of balls for demo
    const battingTeam = await prisma.team.findUnique({
      where: { id: teamRecords.RAJ.id },
      include: { players: true },
    });
    const bowlingTeam = await prisma.team.findUnique({
      where: { id: teamRecords.RAN.id },
      include: { players: true },
    });
    if (battingTeam && bowlingTeam) {
      const battingXI = battingTeam.players.slice(0, 11);
      const bowlingXI = bowlingTeam.players.slice(0, 11);
      const inn = await prisma.innings.create({
        data: {
          matchId: liveMatch.id,
          inningsNumber: 1,
          battingTeamId: battingTeam.id,
          bowlingTeamId: bowlingTeam.id,
          currentStrikerId: battingXI[0].id,
          currentNonStrikerId: battingXI[1].id,
          currentBowlerId: bowlingXI[7].id, // a bowler
        },
      });
      for (let i = 0; i < battingXI.length; i++) {
        await prisma.batterCard.create({
          data: { inningsId: inn.id, playerId: battingXI[i].id, order: i + 1 },
        });
      }
      for (const p of bowlingXI) {
        await prisma.bowlerCard.create({ data: { inningsId: inn.id, playerId: p.id } });
      }

      // Simulate a few balls — 2 overs of assorted scoring
      const demoBalls: {
        runs: number;
        extraType: "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "PENALTY";
      }[] = [
        { runs: 1, extraType: "NONE" },
        { runs: 4, extraType: "NONE" },
        { runs: 0, extraType: "NONE" },
        { runs: 2, extraType: "NONE" },
        { runs: 1, extraType: "WIDE" },
        { runs: 1, extraType: "NONE" },
        { runs: 6, extraType: "NONE" },
        { runs: 0, extraType: "NONE" },
        { runs: 1, extraType: "NONE" },
        { runs: 0, extraType: "NONE" },
        { runs: 2, extraType: "NONE" },
        { runs: 1, extraType: "NONE" },
        { runs: 4, extraType: "NONE" },
      ];
      let seq = 1;
      let legalBalls = 0;
      let runs = 0;
      let extras = 0;
      let wides = 0;
      let currentStrikerId = battingXI[0].id;
      let currentNonStrikerId = battingXI[1].id;
      const currentBowlerId = bowlingXI[7].id;
      for (const b of demoBalls) {
        const norm = normaliseBall(b);
        const overNumber = Math.floor(legalBalls / 6);
        const ballInOver = norm.isLegal ? (legalBalls % 6) + 1 : legalBalls % 6;
        await prisma.ballEvent.create({
          data: {
            inningsId: inn.id,
            sequence: seq++,
            overNumber,
            ballInOver,
            isLegal: norm.isLegal,
            strikerId: currentStrikerId,
            nonStrikerId: currentNonStrikerId,
            bowlerId: currentBowlerId,
            runs: norm.runsToBatter,
            extraType: norm.extraType,
            extraRuns: norm.extraRuns,
          },
        });
        if (norm.isLegal) legalBalls += 1;
        runs += norm.totalRuns;
        if (norm.extraType !== "NONE") {
          extras += norm.extraRuns;
          if (norm.extraType === "WIDE") wides += norm.extraRuns;
        }
        // strike rotation
        const swap =
          (norm.totalRuns % 2 === 1) !== (norm.isLegal && ballInOver === 6);
        if (swap) [currentStrikerId, currentNonStrikerId] = [currentNonStrikerId, currentStrikerId];

        // update batter card runs/balls (approx — we could rely on recomputeInnings but seed inline for speed)
      }
      await prisma.innings.update({
        where: { id: inn.id },
        data: {
          runs,
          legalBalls,
          extras,
          wides,
          currentStrikerId,
          currentNonStrikerId,
          currentBowlerId,
        },
      });
      // Recompute batter/bowler cards from events using the shared engine
      const { recomputeInnings } = await import("../src/lib/scoring");
      await recomputeInnings(inn.id);
    }
  }

  console.log("Seed complete.");
  console.log("Admin:  admin / admin123");
  console.log("Scorer: scorer1 / scorer123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
