// 易错复习：独立副进度，只读主进度累计与最近判定，不回写学习记录。
export const MISTAKE_RATE = 0.5;
export const MISTAKE_MIN = 3;

export function mistakeEligible(main, {exclude} = {}) {
  const words = new Map();
  main.attempts.forEach((attempt, order) => {
    for (const id of attempt.ids) {
      const counts = main.stats[id];
      if (!counts) continue;
      const vote = attempt.votes[id];
      const total = counts.good + counts.bad;
      let item = words.get(id);
      if (!item) {
        item = {id, order, part: attempt.part, votes: []};
        words.set(id, item);
      }
      item.order = order;
      item.lowRate = total >= MISTAKE_MIN && counts.bad / total >= MISTAKE_RATE;
      item.rate = total ? counts.bad / total : 0;
      item.margin = counts.bad - counts.good;
      if (vote) item.votes = [...item.votes, vote].slice(-2);
    }
  });
  const list = [];
  for (const item of words.values()) {
    if (exclude?.has(item.id)) continue;
    const recentBad = item.votes.length === 2 && item.votes.every(v => v === 'bad');
    if (!item.lowRate && !recentBad) continue;
    list.push({...item, recentBad});
  }
  return list;
}

export function sortMistakes(list) {
  return [...list].sort((a, b) =>
    Number(b.recentBad) - Number(a.recentBad) ||
    b.order - a.order ||
    b.margin - a.margin ||
    b.rate - a.rate ||
    a.id.localeCompare(b.id));
}

export function mistakeIds(main, mistakeStats = {}) {
  const exclude = new Set(Object.entries(mistakeStats).filter(([, s]) => s?.consolidated).map(([id]) => id));
  return sortMistakes(mistakeEligible(main, {exclude})).map(e => e.id);
}

// 按教材顺序把易错词分到各自 Part；每个 Part 就是一组。
export function mistakePartList(main, mistakeStats = {}) {
  const exclude = new Set(Object.entries(mistakeStats).filter(([, s]) => s?.consolidated).map(([id]) => id));
  const groups = [];
  for (const item of sortMistakes(mistakeEligible(main, {exclude}))) {
    const part = main.order.includes(item.part) ? item.part : main.order[0];
    let bucket = groups.find(g => g.part === part);
    if (!bucket) {
      bucket = {part, ids: []};
      groups.push(bucket);
    }
    bucket.ids.push(item.id);
  }
  return groups.sort((a, b) => main.order.indexOf(a.part) - main.order.indexOf(b.part));
}

export function mistakeRound(main, mistakeStats, round = 1) {
  const parts = mistakePartList(main, mistakeStats);
  if (!parts.length) return null;
  const ids = parts.flatMap(p => p.ids);
  return {round, launchId: crypto.randomUUID(), ids, parts, opened: {}, votes: {}, group: 0};
}

export function validMistakeRound(quiz, main) {
  if (!Number.isSafeInteger(quiz?.round) || quiz.round < 1 || typeof quiz.launchId !== 'string' || !quiz.launchId) return false;
  if (!Array.isArray(quiz.ids) || !quiz.ids.length || new Set(quiz.ids).size !== quiz.ids.length) return false;
  if (!quiz.ids.every(id => main.stats[id])) return false;
  if (!Array.isArray(quiz.parts) || !quiz.parts.length) return false;
  let covered = 0;
  for (const group of quiz.parts) {
    if (!main.order.includes(group?.part) || !Array.isArray(group.ids) || !group.ids.length) return false;
    if (!group.ids.every(id => quiz.ids.includes(id))) return false;
    covered += group.ids.length;
  }
  if (covered !== quiz.ids.length) return false;
  if (!quiz.opened || !quiz.votes) return false;
  for (const [id, open] of Object.entries(quiz.opened)) if (!quiz.ids.includes(id) || typeof open !== 'boolean') return false;
  for (const [id, vote] of Object.entries(quiz.votes)) if (!quiz.ids.includes(id) || !['good', 'bad'].includes(vote)) return false;
  return Number.isInteger(quiz.group) && quiz.group >= 0 && quiz.group < quiz.parts.length;
}

export function ensureMistakeRound(main, quiz, mistakeStats) {
  if (validMistakeRound(quiz, main)) return quiz;
  return mistakeRound(main, mistakeStats);
}

export function mistakeAction(quiz, main, mistakeStats, action, id, kind) {
  if (!quiz) return null;
  const next = structuredClone(quiz);
  if (action === 'toggle') return next.ids.includes(id) ? (next.opened[id] = !next.opened[id], next) : quiz;
  if (action === 'vote') return next.ids.includes(id) && next.opened[id] && ['good', 'bad'].includes(kind) && next.votes[id] !== kind ? (next.votes[id] = kind, next) : quiz;
  if (action === 'group' && Number.isInteger(id) && id >= 0 && id < next.parts.length) {
    next.group = id;
    return next;
  }
  // 再测本组：只清空当前 Part 的翻开与判定，其他 Part 进度保留。
  if (action === 'repeat') {
    const opened = {...next.opened}, votes = {...next.votes};
    for (const gid of next.parts[next.group].ids) {
      delete opened[gid];
      delete votes[gid];
    }
    return {...next, round: next.round + 1, launchId: crypto.randomUUID(), opened, votes};
  }
  if (action === 'next') return {...next, group: (next.group + 1) % next.parts.length};
  if (action === 'refresh') return mistakeRound(main, mistakeStats, next.round + 1) || quiz;
  if (action === 'order' && id === true || action === 'order' && id === false) {
    const order = new Map();
    for (const attempt of main.attempts) for (const wid of attempt.ids) if (!order.has(wid)) order.set(wid, order.size);
    const bankOrder = entry => order.has(entry) ? order.get(entry) : Number.MAX_SAFE_INTEGER;
    next.parts = next.parts.map(group => {
      const ordered = group.ids.slice().sort((a, b) => bankOrder(a) - bankOrder(b));
      if (id !== true) return {...group, ids: ordered};
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
      return {...group, ids: ordered};
    });
    next.ids = next.parts.flatMap(group => group.ids);
    next.shuffled = id === true;
    return next;
  }
  return quiz;
}

// 每次判定单独累计：判对按轮次去重累计，两个不同轮次判对后移入已巩固；判错清零并移出已巩固。
export function applyJudge(id, kind, stats = {}, round = 0) {
  const row = stats[id] || {streak: 0, consolidated: false, rounds: []}, next = {...row, rounds: [...(row.rounds || [])]};
  if (kind === 'bad') {
    next.streak = 0;
    next.consolidated = false;
    next.rounds = [];
  } else {
    if (!next.rounds.includes(round)) next.rounds = [...next.rounds, round].slice(-2);
    next.streak = next.rounds.length;
    if (next.streak >= 2) next.consolidated = true;
  }
  if (next.streak === row.streak && next.consolidated === row.consolidated && JSON.stringify(next.rounds) === JSON.stringify(row.rounds || [])) return stats;
  return {...stats, [id]: next};
}
