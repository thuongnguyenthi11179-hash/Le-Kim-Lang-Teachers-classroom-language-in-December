export interface WritingCheckResult {
  isCorrect: boolean;
  isExact: boolean;
  hasMinorPunctuationNote: boolean;
  feedbackVi: string;
  feedbackEn: string;
}

function normalizeSpacingAndQuotes(input: string): string {
  return input
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([?.!,])/g, '$1');
}

function stripPunctuation(input: string): string {
  return normalizeSpacingAndQuotes(input)
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function checkArrangeSentence(userSentence: string, expected: string): WritingCheckResult {
  const cleanUser = normalizeSpacingAndQuotes(userSentence);
  const cleanExpected = normalizeSpacingAndQuotes(expected);

  if (cleanUser.toLowerCase() === cleanExpected.toLowerCase()) {
    return {
      isCorrect: true,
      isExact: true,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Excellent sentence order!',
      feedbackVi: 'Thầy/cô sắp xếp câu hoàn toàn chính xác!',
    };
  }

  return {
    isCorrect: false,
    isExact: false,
    hasMinorPunctuationNote: false,
    feedbackEn: 'Almost there! Try rearranging the words.',
    feedbackVi: `Thứ tự từ chưa khớp với câu mẫu "${expected}". Thầy/cô hãy thử xếp lại nhé!`,
  };
}

export function checkCompleteWord(
  userInput: string,
  acceptedWords: string[],
  expectedWord: string
): WritingCheckResult {
  const clean = normalizeSpacingAndQuotes(userInput).toLowerCase().replace(/[.,!?]/g, '');
  if (!clean) {
    return {
      isCorrect: false,
      isExact: false,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Please type the missing word.',
      feedbackVi: 'Thầy/cô vui lòng nhập từ còn thiếu trước khi kiểm tra.',
    };
  }

  const normalizedAccepted = acceptedWords.map((w) => w.toLowerCase().trim());
  if (normalizedAccepted.includes(clean)) {
    return {
      isCorrect: true,
      isExact: true,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Correct spelling!',
      feedbackVi: `Chính xác! Từ còn thiếu là "${expectedWord}".`,
    };
  }

  const dist = levenshtein(clean, expectedWord.toLowerCase());
  if (dist <= 2) {
    return {
      isCorrect: false,
      isExact: false,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Very close! Check the spelling.',
      feedbackVi: `Gần đúng rồi! Thầy/cô kiểm tra lại chính tả của từ "${expectedWord}" nhé (đã gõ "${userInput.trim()}").`,
    };
  }

  return {
    isCorrect: false,
    isExact: false,
    hasMinorPunctuationNote: false,
    feedbackEn: 'Nice try! Please check the hint and try again.',
    feedbackVi: `Chưa đúng rồi. Gợi ý: từ cần điền là "${expectedWord}". Thầy/cô hãy gõ lại để ghi nhớ nhé!`,
  };
}

export function checkTranslationAnswer(
  userInput: string,
  referenceAnswer: string,
  acceptedSynonyms: string[]
): WritingCheckResult {
  const cleanUser = normalizeSpacingAndQuotes(userInput);
  if (!cleanUser) {
    return {
      isCorrect: false,
      isExact: false,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Please write your English sentence.',
      feedbackVi: 'Thầy/cô vui lòng viết câu tiếng Anh trước khi nộp bài.',
    };
  }

  const allTargets = Array.from(new Set([referenceAnswer, ...acceptedSynonyms]));

  // Exact match ignoring case & extra spaces
  for (const target of allTargets) {
    if (cleanUser.toLowerCase() === normalizeSpacingAndQuotes(target).toLowerCase()) {
      const isRef = cleanUser.toLowerCase() === normalizeSpacingAndQuotes(referenceAnswer).toLowerCase();
      return {
        isCorrect: true,
        isExact: isRef,
        hasMinorPunctuationNote: false,
        feedbackEn: isRef ? 'Great writing!' : 'Natural and accurate English!',
        feedbackVi: isRef
          ? 'Chính xác tuyệt đối! Câu viết đúng chính tả và dấu câu.'
          : `Rất tự nhiên và đúng ý! (Câu mẫu của bài học là: "${referenceAnswer}")`,
      };
    }
  }

  // Match ignoring punctuation (e.g., forgot '?' or '!')
  const strippedUser = stripPunctuation(cleanUser);
  for (const target of allTargets) {
    if (strippedUser === stripPunctuation(target)) {
      const expectedEnd = referenceAnswer.slice(-1);
      const punctHint =
        expectedEnd === '?'
          ? 'Lưu ý thêm dấu chấm hỏi (?) cuối câu hỏi nhé.'
          : 'Lưu ý thêm dấu chấm than (!) để câu thêm tự nhiên và rõ cảm xúc nhé.';
      return {
        isCorrect: true,
        isExact: false,
        hasMinorPunctuationNote: true,
        feedbackEn: 'Correct words! Watch the punctuation.',
        feedbackVi: `Đúng nội dung và từ vựng! ${punctHint}`,
      };
    }
  }

  // Check near spelling match (1-2 typos)
  const refStripped = stripPunctuation(referenceAnswer);
  const dist = levenshtein(strippedUser, refStripped);
  if (dist <= 2) {
    return {
      isCorrect: false,
      isExact: false,
      hasMinorPunctuationNote: false,
      feedbackEn: 'Almost right! Check one or two letters.',
      feedbackVi: `Gần đúng lắm rồi! Thầy/cô kiểm tra lại lỗi chính tả nhỏ so với câu mẫu: "${referenceAnswer}".`,
    };
  }

  return {
    isCorrect: false,
    isExact: false,
    hasMinorPunctuationNote: false,
    feedbackEn: 'Try again! Compare with the sample sentence.',
    feedbackVi: `Chưa khớp ý chính. Câu mẫu gợi ý là: "${referenceAnswer}". Thầy/cô hãy xem lại và thử gõ lại nhé!`,
  };
}
