import type { LessonData } from '../types/app';

export const HERO_BANNER_IMAGE =
  '/src/assets/images/hero_teachers_banner_1795317135463.jpg';

export const LESSONS: LessonData[] = [
  {
    id: 1,
    week: 1,
    weekTitle: 'Week 1 – Praise and Encouragement',
    english: 'Well done!',
    vietnamese: 'Làm tốt lắm!',
    ipa: '/ˌwel ˈdʌn/',
    image: '/src/assets/images/lesson_01_well_done_1795317135172.jpg',
    situationTitleVi: 'Khen học sinh hoàn thành tốt bài tập',
    situationDescVi:
      'Sử dụng khi học sinh vừa làm đúng bài tập trong vở, viết chữ đẹp hoặc trả lời chính xác câu hỏi của cô.',
    pronunciationTipVi:
      'Nhấn giọng nhẹ ở từ "done", đọc rõ âm cuối /l/ ở "well" và /n/ ở "done" với giọng tươi vui.',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'Teacher, I finished my exercise!',
        vietnamese: 'Thưa cô, em làm xong bài tập rồi ạ!',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Well done! Here is a gold star for you.',
        vietnamese: 'Làm tốt lắm! Cô tặng em một ngôi sao vàng nhé.',
      },
    ],
    listening: {
      id: 'L1-listen-1',
      audioText: 'Well done!',
      options: ['Well done!', "Don't worry. You can do it!", 'Any ideas?'],
      correctIndex: 0,
      hintVi: 'Câu khen ngắn gồm 2 từ, bắt đầu bằng âm /w/.',
    },
    readingQuestions: [
      {
        id: 'L1-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you say "Well done!"?',
        promptVi: 'Khi nào thầy/cô nói "Well done!"?',
        options: [
          'When a student completes an exercise correctly.',
          'When a student forgets a textbook at home.',
          'When the class finishes lunch.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Well done!" (Làm tốt lắm!) dùng để khen ngợi học sinh khi các em hoàn thành tốt bài tập hoặc trả lời đúng.',
      },
      {
        id: 'L1-read-2',
        type: 'choose_meaning',
        typeLabelVi: 'Chọn nghĩa tiếng Việt đúng',
        prompt: 'What does "Well done!" mean in Vietnamese?',
        promptVi: 'Câu "Well done!" có nghĩa là gì?',
        options: ['Làm tốt lắm!', 'Các em sẵn sàng chưa?', 'Em cảm thấy thế nào?'],
        correctIndex: 0,
        explanationVi: '"Well done!" nghĩa là "Làm tốt lắm!".',
      },
    ],
    writing: {
      arrange: {
        id: 'L1-write-arr',
        tokens: ['done', 'Well', '!'],
        correctSentence: 'Well done!',
      },
      complete: {
        id: 'L1-write-comp',
        promptTemplate: 'Well ______!',
        missingWord: 'done',
        acceptedWords: ['done'],
        fullSentence: 'Well done!',
        hintVi: 'Từ có 4 chữ cái, nghĩa là "đã làm xong/hoàn thành".',
      },
      translate: {
        id: 'L1-write-trans',
        vietnamesePrompt: 'Làm tốt lắm!',
        referenceAnswer: 'Well done!',
        acceptedSynonyms: ['Well done!', 'Good job!', 'Great job!', 'Very good!'],
        tipVi: 'Câu tiêu chuẩn bài 1 là "Well done!" (cũng chấp nhận cách khen tự nhiên tương đương).',
      },
    },
  },
  {
    id: 2,
    week: 1,
    weekTitle: 'Week 1 – Praise and Encouragement',
    english: 'Great job!',
    vietnamese: 'Giỏi lắm!',
    ipa: '/ɡreɪt dʒɑːb/',
    image: '/src/assets/images/lesson_02_great_job_1795317134815.jpg',
    situationTitleVi: 'Chúc mừng học sinh hoặc nhóm hoàn thành nhiệm vụ',
    situationDescVi:
      'Sử dụng khi một học sinh hoặc cả nhóm trình bày sản phẩm, làm việc nhóm hiệu quả hoặc đạt kết quả xuất sắc.',
    pronunciationTipVi:
      'Đọc "Great" có nguyên âm đôi /eɪ/ và âm cuối /t/, từ "job" đọc /dʒɑːb/ theo giọng Anh–Mỹ.',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Nhóm học sinh',
        english: 'Look at our group poster, teacher!',
        vietnamese: 'Cô ơi, xem tranh nhóm em làm nè!',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Great job! Your picture is so colorful.',
        vietnamese: 'Giỏi lắm! Bức tranh của các em rất nhiều màu sắc.',
      },
    ],
    listening: {
      id: 'L2-listen-1',
      audioText: 'Great job!',
      options: ['Nice try!', 'Great job!', 'Are you ready?'],
      correctIndex: 1,
      hintVi: 'Nghe âm /ɡreɪt/ ở từ đầu tiên và /dʒɑːb/ ở từ thứ hai.',
    },
    readingQuestions: [
      {
        id: 'L2-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When is the best time to say "Great job!"?',
        promptVi: 'Thời điểm nào thích hợp nhất để nói "Great job!"?',
        options: [
          'When a group finishes a wonderful classroom project.',
          'When a student asks to go outside.',
          'When the school bell has not rung yet.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Great job!" (Giỏi lắm!) rất phù hợp để chúc mừng cá nhân hoặc cả nhóm hoàn thành xuất sắc nhiệm vụ.',
      },
      {
        id: 'L2-read-2',
        type: 'match_meaning',
        typeLabelVi: 'Nối tiếng Anh với nghĩa tiếng Việt',
        prompt: 'Match "Great job!" with the correct Vietnamese meaning.',
        promptVi: 'Chọn nghĩa đúng của câu "Great job!".',
        options: ['Giỏi lắm!', 'Có ý kiến nào không?', 'Đừng lo lắng.'],
        correctIndex: 0,
        explanationVi: '"Great job!" có nghĩa là "Giỏi lắm!".',
      },
    ],
    writing: {
      arrange: {
        id: 'L2-write-arr',
        tokens: ['job', '!', 'Great'],
        correctSentence: 'Great job!',
      },
      complete: {
        id: 'L2-write-comp',
        promptTemplate: 'Great ______!',
        missingWord: 'job',
        acceptedWords: ['job'],
        fullSentence: 'Great job!',
        hintVi: 'Từ gồm 3 chữ cái, nghĩa là "công việc / phần việc".',
      },
      translate: {
        id: 'L2-write-trans',
        vietnamesePrompt: 'Giỏi lắm!',
        referenceAnswer: 'Great job!',
        acceptedSynonyms: ['Great job!', 'Good job!', 'Well done!', 'Awesome job!'],
        tipVi: 'Đáp án mẫu bài 2 là "Great job!".',
      },
    },
  },
  {
    id: 3,
    week: 1,
    weekTitle: 'Week 1 – Praise and Encouragement',
    english: 'Nice try!',
    vietnamese: 'Cố gắng tốt lắm!',
    ipa: '/naɪs traɪ/',
    image: '/src/assets/images/lesson_03_nice_try_1795317134941.jpg',
    situationTitleVi: 'Động viên học sinh đã nỗ lực dù câu trả lời chưa đúng hẳn',
    situationDescVi:
      'Sử dụng khi học sinh mạnh dạn xung phong trả lời hoặc lên bảng nhưng kết quả chưa chính xác, giúp các em không ngại sai.',
    pronunciationTipVi:
      'Hai từ cùng vần /aɪ/: "Nice" (/naɪs/) và "try" (/traɪ/). Đừng quên âm gió /s/ cuối từ "Nice".',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'Is the answer eight, teacher?',
        vietnamese: 'Thưa cô đáp án là 8 phải không ạ?',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Nice try! Let us count one more time together.',
        vietnamese: 'Cố gắng tốt lắm! Mình cùng đếm lại thêm một lần nữa nhé.',
      },
    ],
    listening: {
      id: 'L3-listen-1',
      audioText: 'Nice try!',
      options: ['Well done!', 'Are you happy?', 'Nice try!'],
      correctIndex: 2,
      hintVi: 'Hai từ ngắn kết thúc cùng âm vần /aɪ/.',
    },
    readingQuestions: [
      {
        id: 'L3-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you say "Nice try!"?',
        promptVi: 'Khi nào thầy/cô nói "Nice try!"?',
        options: [
          'When a student makes an effort even if the answer is not right yet.',
          'When a student leaves school.',
          'When a student asks the time.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Nice try!" (Cố gắng tốt lắm!) dùng để ghi nhận sự nỗ lực của học sinh dù câu trả lời chưa hoàn toàn đúng.',
      },
      {
        id: 'L3-read-2',
        type: 'read_and_answer',
        typeLabelVi: 'Đọc hội thoại và chọn đáp án',
        prompt: 'Minh tried to spell a difficult word and missed one letter. What should the teacher say?',
        promptVi: 'Em Minh cố gắng đánh vần một từ khó nhưng thiếu 1 chữ cái. Cô giáo nên nói gì?',
        options: ['Nice try!', 'Are you ready?', 'How do you feel?'],
        correctIndex: 0,
        explanationVi:
          'Cô giáo nên nói "Nice try!" để động viên sự cố gắng của em Minh.',
      },
    ],
    writing: {
      arrange: {
        id: 'L3-write-arr',
        tokens: ['try', 'Nice', '!'],
        correctSentence: 'Nice try!',
      },
      complete: {
        id: 'L3-write-comp',
        promptTemplate: 'Nice ______!',
        missingWord: 'try',
        acceptedWords: ['try'],
        fullSentence: 'Nice try!',
        hintVi: 'Từ có 3 chữ cái, nghĩa là "sự thử sức / cố gắng".',
      },
      translate: {
        id: 'L3-write-trans',
        vietnamesePrompt: 'Cố gắng tốt lắm!',
        referenceAnswer: 'Nice try!',
        acceptedSynonyms: ['Nice try!', 'Good try!', 'Good effort!'],
        tipVi: 'Câu chuẩn bài 3 là "Nice try!".',
      },
    },
  },
  {
    id: 4,
    week: 2,
    weekTitle: 'Week 2 – Motivation & Confidence',
    english: "Don't worry. You can do it!",
    vietnamese: 'Đừng lo lắng. Em làm được mà!',
    ipa: '/doʊnt ˈwɜːri | juː kæn duː ɪt/',
    image: '/src/assets/images/lesson_04_dont_worry_1795317136934.jpg',
    situationTitleVi: 'An ủi và khích lệ học sinh đang rụt rè, lo lắng',
    situationDescVi:
      'Sử dụng khi học sinh cảm thấy bài khó, sợ làm sai hoặc hồi hộp trước giờ kiểm tra hay lúc phát biểu.',
    pronunciationTipVi:
      'Ngắt nhẹ sau "Don\'t worry." rồi nhấn giọng ấm áp ở "can do it!" để truyền sự tự tin cho học sinh.',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'Teacher, this math problem is a bit hard.',
        vietnamese: 'Cô ơi, bài toán này hơi khó ạ.',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: "Don't worry. You can do it!",
        vietnamese: 'Đừng lo lắng. Em làm được mà!',
      },
    ],
    listening: {
      id: 'L4-listen-1',
      audioText: "Don't worry. You can do it!",
      options: [
        "Don't worry. You can do it!",
        "I'm proud of you!",
        'Good voice and clear!',
      ],
      correctIndex: 0,
      hintVi: 'Đây là câu dài gồm 2 vế: an ủi và khích lệ.',
    },
    readingQuestions: [
      {
        id: 'L4-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When should a teacher say "Don\'t worry. You can do it!"?',
        promptVi: 'Khi nào thầy/cô nên nói "Don\'t worry. You can do it!"?',
        options: [
          'When a student feels nervous about a difficult task.',
          'When the class is cheering at the end of a game.',
          'When asking students to share new ideas.',
        ],
        correctIndex: 0,
        explanationVi:
          'Câu này dùng để trấn an ("Don\'t worry.") và tiếp thêm niềm tin ("You can do it!") khi học sinh lo lắng.',
      },
      {
        id: 'L4-read-2',
        type: 'choose_meaning',
        typeLabelVi: 'Chọn nghĩa tiếng Việt đúng',
        prompt: 'What does "Don\'t worry. You can do it!" mean?',
        promptVi: 'Nghĩa tiếng Việt chính xác của câu là gì?',
        options: [
          'Đừng lo lắng. Em làm được mà!',
          'Cô tự hào về em!',
          'Nói to và rõ lắm!',
        ],
        correctIndex: 0,
        explanationVi:
          '"Don\'t worry." = Đừng lo lắng; "You can do it!" = Em làm được mà!',
      },
    ],
    writing: {
      arrange: {
        id: 'L4-write-arr',
        tokens: ['can', 'You', 'it', 'do', '!', "Don't", 'worry.'],
        correctSentence: "Don't worry. You can do it!",
      },
      complete: {
        id: 'L4-write-comp',
        promptTemplate: "Don't ______. You can do it!",
        missingWord: 'worry',
        acceptedWords: ['worry'],
        fullSentence: "Don't worry. You can do it!",
        hintVi: 'Từ có 5 chữ cái, nghĩa là "lo lắng".',
      },
      translate: {
        id: 'L4-write-trans',
        vietnamesePrompt: 'Đừng lo lắng. Em làm được mà!',
        referenceAnswer: "Don't worry. You can do it!",
        acceptedSynonyms: [
          "Don't worry. You can do it!",
          "Do not worry. You can do it!",
          "Don't worry, you can do it!",
        ],
        tipVi: 'Viết đủ hai vế: "Don\'t worry. You can do it!" (dấu phẩy hoặc dấu chấm đều hợp lý).',
      },
    },
  },
  {
    id: 5,
    week: 2,
    weekTitle: 'Week 2 – Motivation & Confidence',
    english: "I'm proud of you!",
    vietnamese: 'Cô tự hào về em!',
    ipa: '/aɪm praʊd əv juː/',
    image: '/src/assets/images/lesson_05_proud_of_you_1795317133183.jpg',
    situationTitleVi: 'Bày tỏ niềm tự hào trước sự tiến bộ của học sinh',
    situationDescVi:
      'Sử dụng khi học sinh tiến bộ rõ rệt, biết giúp đỡ bạn bè hoặc vượt qua thử thách khó trong học tập.',
    pronunciationTipVi:
      'Nối âm nhẹ giữa "proud" và "of" (/praʊd‿əv/), nhấn giọng ấm áp ở từ "proud".',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'Teacher, I read the whole story by myself today!',
        vietnamese: 'Cô ơi, hôm nay em tự đọc hết cả câu chuyện rồi ạ!',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: "I'm proud of you! Keep up the great work.",
        vietnamese: 'Cô tự hào về em! Em tiếp tục phát huy nhé.',
      },
    ],
    listening: {
      id: 'L5-listen-1',
      audioText: "I'm proud of you!",
      options: ['How do you feel?', "I'm proud of you!", 'Well done!'],
      correctIndex: 1,
      hintVi: 'Nghe từ nổi bật "proud" (/praʊd/) ở giữa câu.',
    },
    readingQuestions: [
      {
        id: 'L5-read-1',
        type: 'match_meaning',
        typeLabelVi: 'Nối tiếng Anh với nghĩa tiếng Việt',
        prompt: 'What does "I\'m proud of you!" mean?',
        promptVi: 'Câu "I\'m proud of you!" có nghĩa tiếng Việt là gì?',
        options: ['Cô tự hào về em!', 'Các em có vui không?', 'Cố gắng tốt lắm!'],
        correctIndex: 0,
        explanationVi: '"I\'m proud of you!" có nghĩa là "Cô tự hào về em!".',
      },
      {
        id: 'L5-read-2',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you tell a student "I\'m proud of you!"?',
        promptVi: 'Khi nào thầy/cô nói "I\'m proud of you!" với học sinh?',
        options: [
          'When a student shows wonderful improvement or helps a classmate.',
          'When asking if students are ready for a quiz.',
          'When checking the classroom door.',
        ],
        correctIndex: 0,
        explanationVi:
          'Câu này mang lại cảm giác được trân trọng khi học sinh tiến bộ hoặc làm việc tốt.',
      },
    ],
    writing: {
      arrange: {
        id: 'L5-write-arr',
        tokens: ['of', "I'm", 'you', 'proud', '!'],
        correctSentence: "I'm proud of you!",
      },
      complete: {
        id: 'L5-write-comp',
        promptTemplate: "I'm ______ of you!",
        missingWord: 'proud',
        acceptedWords: ['proud'],
        fullSentence: "I'm proud of you!",
        hintVi: 'Từ có 5 chữ cái, nghĩa là "tự hào".',
      },
      translate: {
        id: 'L5-write-trans',
        vietnamesePrompt: 'Cô tự hào về em!',
        referenceAnswer: "I'm proud of you!",
        acceptedSynonyms: ["I'm proud of you!", 'I am proud of you!', "I'm so proud of you!"],
        tipVi: 'Cả "I\'m proud of you!" và "I am proud of you!" đều hoàn toàn chính xác.',
      },
    },
  },
  {
    id: 6,
    week: 3,
    weekTitle: 'Week 3 – Classroom Interaction',
    english: 'Are you ready?',
    vietnamese: 'Các em sẵn sàng chưa?',
    ipa: '/ɑːr juː ˈredi/',
    image: '/src/assets/images/lesson_06_are_you_ready_1795317135011.jpg',
    situationTitleVi: 'Hỏi cả lớp trước khi bắt đầu tiết học hoặc trò chơi',
    situationDescVi:
      'Sử dụng để tạo không khí hào hứng trước khi bắt đầu bài mới, trò chơi khởi động hoặc hoạt động nghe – hát.',
    pronunciationTipVi:
      'Câu hỏi Yes/No nên lên giọng nhẹ ở cuối từ "ready?" (/ˈredi↗/) để tạo sự hứng khởi.',
    dialogue: [
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Let us play a fun word game! Are you ready?',
        vietnamese: 'Chúng ta cùng chơi trò chơi từ vựng nhé! Các em sẵn sàng chưa?',
      },
      {
        speaker: 'Student',
        speakerVi: 'Cả lớp',
        english: 'Yes, teacher! We are ready!',
        vietnamese: 'Dạ rồi ạ! Chúng em sẵn sàng rồi ạ!',
      },
    ],
    listening: {
      id: 'L6-listen-1',
      audioText: 'Are you ready?',
      options: ['Are you happy?', 'Are you ready?', 'Any ideas?'],
      correctIndex: 1,
      hintVi: 'Chú ý từ cuối là "ready" (sẵn sàng), khác với "happy".',
    },
    readingQuestions: [
      {
        id: 'L6-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you ask "Are you ready?"?',
        promptVi: 'Thầy/cô thường hỏi "Are you ready?" khi nào?',
        options: [
          'Right before starting a classroom game or activity.',
          'When praising a student for a loud voice.',
          'When comforting a worried student.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Are you ready?" (Các em sẵn sàng chưa?) giúp thu hút sự chú ý trước khi bắt đầu hoạt động.',
      },
      {
        id: 'L6-read-2',
        type: 'read_and_answer',
        typeLabelVi: 'Đọc câu hỏi và chọn cách trả lời tự nhiên',
        prompt: 'Teacher asks: "Are you ready?" — How do students usually answer?',
        promptVi: 'Cô hỏi "Are you ready?", học sinh thường đáp lại thế nào?',
        options: ['Yes, we are ready!', 'Well done!', 'Nice try!'],
        correctIndex: 0,
        explanationVi:
          'Học sinh sẽ hào hứng đáp "Yes, we are ready!" (Dạ, chúng em sẵn sàng rồi ạ!).',
      },
    ],
    writing: {
      arrange: {
        id: 'L6-write-arr',
        tokens: ['ready', 'Are', '?', 'you'],
        correctSentence: 'Are you ready?',
      },
      complete: {
        id: 'L6-write-comp',
        promptTemplate: 'Are you ______?',
        missingWord: 'ready',
        acceptedWords: ['ready'],
        fullSentence: 'Are you ready?',
        hintVi: 'Tính từ 5 chữ cái, nghĩa là "sẵn sàng".',
      },
      translate: {
        id: 'L6-write-trans',
        vietnamesePrompt: 'Các em sẵn sàng chưa?',
        referenceAnswer: 'Are you ready?',
        acceptedSynonyms: ['Are you ready?', 'Are you all ready?'],
        tipVi: 'Nhớ đặt dấu chấm hỏi (?) ở cuối câu hỏi nhé!',
      },
    },
  },
  {
    id: 7,
    week: 3,
    weekTitle: 'Week 3 – Classroom Interaction',
    english: 'Any ideas?',
    vietnamese: 'Có ý kiến nào không?',
    ipa: '/ˈeni aɪˈdɪəz/',
    image: '/src/assets/images/lesson_07_any_ideas_1795317134735.jpg',
    situationTitleVi: 'Khuyến khích học sinh phát biểu và đóng góp ý tưởng',
    situationDescVi:
      'Sử dụng trong hoạt động thảo luận, giải đố hoặc khi muốn mời học sinh giơ tay chia sẻ suy nghĩ của mình.',
    pronunciationTipVi:
      'Đọc rõ số nhiều /z/ ở cuối từ "ideas" (/aɪˈdɪəz/) và lên giọng thân thiện ở cuối câu.',
    dialogue: [
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'How can we keep our classroom clean? Any ideas?',
        vietnamese: 'Làm thế nào để giữ lớp học sạch đẹp? Có ý kiến nào không?',
      },
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'We can put trash in the bin, teacher!',
        vietnamese: 'Thưa cô, chúng em bỏ rác đúng nơi quy định ạ!',
      },
    ],
    listening: {
      id: 'L7-listen-1',
      audioText: 'Any ideas?',
      options: ['Any ideas?', 'Great job!', 'How do you feel?'],
      correctIndex: 0,
      hintVi: 'Câu hỏi ngắn gồm 2 từ, bắt đầu bằng "Any".',
    },
    readingQuestions: [
      {
        id: 'L7-read-1',
        type: 'choose_meaning',
        typeLabelVi: 'Chọn nghĩa tiếng Việt đúng',
        prompt: 'What does "Any ideas?" mean?',
        promptVi: 'Câu "Any ideas?" có nghĩa là gì?',
        options: ['Có ý kiến nào không?', 'Làm tốt lắm!', 'Nói to và rõ lắm!'],
        correctIndex: 0,
        explanationVi: '"Any ideas?" nghĩa là "Có ý kiến nào không?" (dùng để mời học sinh góp ý).',
      },
      {
        id: 'L7-read-2',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you ask "Any ideas?" in class?',
        promptVi: 'Khi nào thầy/cô dùng câu "Any ideas?" trong lớp?',
        options: [
          'When inviting students to brainstorm or share answers.',
          'When thanking students for cleaning the board.',
          'When asking if students are happy after a song.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Any ideas?" giúp khuyến khích học sinh suy nghĩ sáng tạo và mạnh dạn giơ tay.',
      },
    ],
    writing: {
      arrange: {
        id: 'L7-write-arr',
        tokens: ['ideas', '?', 'Any'],
        correctSentence: 'Any ideas?',
      },
      complete: {
        id: 'L7-write-comp',
        promptTemplate: 'Any ______?',
        missingWord: 'ideas',
        acceptedWords: ['ideas'],
        fullSentence: 'Any ideas?',
        hintVi: 'Danh từ số nhiều nghĩa là "các ý tưởng / ý kiến".',
      },
      translate: {
        id: 'L7-write-trans',
        vietnamesePrompt: 'Có ý kiến nào không?',
        referenceAnswer: 'Any ideas?',
        acceptedSynonyms: ['Any ideas?', 'Do you have any ideas?', 'Have you got any ideas?'],
        tipVi: 'Câu ngắn gọn tự nhiên nhất trong lớp là "Any ideas?".',
      },
    },
  },
  {
    id: 8,
    week: 3,
    weekTitle: 'Week 3 – Classroom Interaction',
    english: 'Good voice and clear!',
    vietnamese: 'Nói to và rõ lắm!',
    ipa: '/ɡʊd vɔɪs ænd klɪr/',
    image: '/src/assets/images/lesson_08_good_voice_1795317135173.jpg',
    situationTitleVi: 'Khen học sinh đọc bài hoặc phát biểu to, rõ ràng',
    situationDescVi:
      'Sử dụng khi học sinh đứng lên đọc bài, kể chuyện hoặc trả lời câu hỏi với giọng tự tin, rõ chữ để cả lớp cùng nghe.',
    pronunciationTipVi:
      'Chú ý âm cuối /s/ ở "voice" (/vɔɪs/) và âm /r/ nhẹ ở cuối từ "clear" (/klɪr/) theo giọng Anh–Mỹ.',
    dialogue: [
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'Good morning, everyone! My name is An.',
        vietnamese: 'Em chào cả lớp! Em tên là An ạ.',
      },
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Good voice and clear! Everyone could hear you.',
        vietnamese: 'Nói to và rõ lắm! Cả lớp đều nghe rất rõ.',
      },
    ],
    listening: {
      id: 'L8-listen-1',
      audioText: 'Good voice and clear!',
      options: ['Nice try!', 'Good voice and clear!', 'Are you ready?'],
      correctIndex: 1,
      hintVi: 'Nghe hai từ khóa "voice" (giọng nói) và "clear" (rõ ràng).',
    },
    readingQuestions: [
      {
        id: 'L8-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you say "Good voice and clear!"?',
        promptVi: 'Khi nào thầy/cô nói "Good voice and clear!"?',
        options: [
          'When a student reads aloud loudly and clearly.',
          'When a student is quiet and shy.',
          'When asking about students\' feelings.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Good voice and clear!" dùng để khen ngợi học sinh phát biểu hoặc đọc bài to, rõ ràng.',
      },
      {
        id: 'L8-read-2',
        type: 'match_meaning',
        typeLabelVi: 'Nối tiếng Anh với nghĩa tiếng Việt',
        prompt: 'Choose the correct Vietnamese meaning for "Good voice and clear!".',
        promptVi: 'Chọn nghĩa tiếng Việt đúng của câu "Good voice and clear!".',
        options: ['Nói to và rõ lắm!', 'Đừng lo lắng. Em làm được mà!', 'Có ý kiến nào không?'],
        correctIndex: 0,
        explanationVi: '"Good voice and clear!" nghĩa là "Nói to và rõ lắm!".',
      },
    ],
    writing: {
      arrange: {
        id: 'L8-write-arr',
        tokens: ['voice', 'and', 'Good', 'clear', '!'],
        correctSentence: 'Good voice and clear!',
      },
      complete: {
        id: 'L8-write-comp',
        promptTemplate: 'Good ______ and clear!',
        missingWord: 'voice',
        acceptedWords: ['voice'],
        fullSentence: 'Good voice and clear!',
        hintVi: 'Từ có 5 chữ cái, nghĩa là "giọng nói".',
      },
      translate: {
        id: 'L8-write-trans',
        vietnamesePrompt: 'Nói to và rõ lắm!',
        referenceAnswer: 'Good voice and clear!',
        acceptedSynonyms: [
          'Good voice and clear!',
          'Loud and clear!',
          'Good and clear voice!',
          'Nice clear voice!',
        ],
        tipVi: 'Câu chuẩn trong thử thách tháng 12 là "Good voice and clear!".',
      },
    },
  },
  {
    id: 9,
    week: 4,
    weekTitle: 'Week 4 – Feelings and Reflection',
    english: 'How do you feel?',
    vietnamese: 'Em cảm thấy thế nào?',
    ipa: '/haʊ duː juː fiːl/',
    image: '/src/assets/images/lesson_09_how_do_you_feel_1795317134737.jpg',
    situationTitleVi: 'Quan tâm, hỏi thăm cảm xúc của học sinh',
    situationDescVi:
      'Sử dụng vào đầu buổi học, sau một hoạt động hoặc khi thấy học sinh có vẻ mệt, buồn hay hào hứng.',
    pronunciationTipVi:
      'Câu hỏi bắt đầu bằng "How" nên xuống giọng nhẹ ở cuối từ "feel" (/fiːl↘/), kéo dài nguyên âm /iː/.',
    dialogue: [
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'Good morning, Hoa! How do you feel today?',
        vietnamese: 'Chào buổi sáng Hoa! Hôm nay em cảm thấy thế nào?',
      },
      {
        speaker: 'Student',
        speakerVi: 'Học sinh',
        english: 'I feel great, teacher!',
        vietnamese: 'Em cảm thấy rất vui ạ!',
      },
    ],
    listening: {
      id: 'L9-listen-1',
      audioText: 'How do you feel?',
      options: ['How do you feel?', 'Are you happy?', "I'm proud of you!"],
      correctIndex: 0,
      hintVi: 'Câu hỏi bắt đầu bằng "How do you..." và kết thúc bằng "feel".',
    },
    readingQuestions: [
      {
        id: 'L9-read-1',
        type: 'choose_meaning',
        typeLabelVi: 'Chọn nghĩa tiếng Việt đúng',
        prompt: 'What does "How do you feel?" mean?',
        promptVi: 'Câu "How do you feel?" có nghĩa là gì?',
        options: ['Em cảm thấy thế nào?', 'Các em sẵn sàng chưa?', 'Giỏi lắm!'],
        correctIndex: 0,
        explanationVi: '"How do you feel?" có nghĩa là "Em cảm thấy thế nào?".',
      },
      {
        id: 'L9-read-2',
        type: 'read_and_answer',
        typeLabelVi: 'Đọc câu hỏi và chọn tình huống đúng',
        prompt: 'A student looks tired after playtime. What warm question can the teacher ask?',
        promptVi: 'Một học sinh trông hơi mệt sau giờ ra chơi. Cô giáo có thể hỏi câu nào đầy quan tâm?',
        options: ['How do you feel?', 'Great job!', 'Any ideas?'],
        correctIndex: 0,
        explanationVi:
          '"How do you feel?" giúp giáo viên thể hiện sự quan tâm gần gũi đến cảm xúc và sức khỏe của học sinh.',
      },
    ],
    writing: {
      arrange: {
        id: 'L9-write-arr',
        tokens: ['do', 'feel', 'How', '?', 'you'],
        correctSentence: 'How do you feel?',
      },
      complete: {
        id: 'L9-write-comp',
        promptTemplate: 'How do you ______?',
        missingWord: 'feel',
        acceptedWords: ['feel'],
        fullSentence: 'How do you feel?',
        hintVi: 'Động từ có 4 chữ cái, nghĩa là "cảm thấy".',
      },
      translate: {
        id: 'L9-write-trans',
        vietnamesePrompt: 'Em cảm thấy thế nào?',
        referenceAnswer: 'How do you feel?',
        acceptedSynonyms: ['How do you feel?', 'How are you feeling?'],
        tipVi: 'Đừng quên dấu hỏi (?) ở cuối câu "How do you feel?".',
      },
    },
  },
  {
    id: 10,
    week: 4,
    weekTitle: 'Week 4 – Feelings and Reflection',
    english: 'Are you happy?',
    vietnamese: 'Các em có vui không?',
    ipa: '/ɑːr juː ˈhæpi/',
    image: '/src/assets/images/lesson_10_are_you_happy_1795317135226.jpg',
    situationTitleVi: 'Hỏi niềm vui của cả lớp sau giờ học hoặc trò chơi',
    situationDescVi:
      'Sử dụng sau một tiết học sôi nổi, hoạt động nhóm hoặc cuối ngày học để lan tỏa tinh thần Lớp học Hạnh phúc.',
    pronunciationTipVi:
      'Mỉm cười khi nói và lên giọng nhẹ ở cuối "happy?" (/ˈhæpi↗/) để tạo sự kết nối vui tươi với học sinh.',
    dialogue: [
      {
        speaker: 'Teacher',
        speakerVi: 'Giáo viên',
        english: 'That was a fun English lesson! Are you happy?',
        vietnamese: 'Tiết học tiếng Anh vừa rồi thật vui! Các em có vui không?',
      },
      {
        speaker: 'Student',
        speakerVi: 'Cả lớp',
        english: 'Yes! We are very happy!',
        vietnamese: 'Dạ có ạ! Chúng em rất vui ạ!',
      },
    ],
    listening: {
      id: 'L10-listen-1',
      audioText: 'Are you happy?',
      options: ['Are you ready?', 'Well done!', 'Are you happy?'],
      correctIndex: 2,
      hintVi: 'Nghe từ cuối cùng là "happy" (vui vẻ).',
    },
    readingQuestions: [
      {
        id: 'L10-read-1',
        type: 'classroom_situation',
        typeLabelVi: 'Chọn tình huống lớp học phù hợp',
        prompt: 'When do you ask "Are you happy?"?',
        promptVi: 'Khi nào thầy/cô hỏi "Are you happy?"?',
        options: [
          'After a joyful class game or wonderful lesson.',
          'When asking students to open page 10.',
          'When checking attendance in the morning.',
        ],
        correctIndex: 0,
        explanationVi:
          '"Are you happy?" (Các em có vui không?) giúp kết thúc hoạt động với bầu không khí tích cực, ấm áp.',
      },
      {
        id: 'L10-read-2',
        type: 'match_meaning',
        typeLabelVi: 'Nối tiếng Anh với nghĩa tiếng Việt',
        prompt: 'What is the Vietnamese meaning of "Are you happy?"?',
        promptVi: 'Nghĩa tiếng Việt của "Are you happy?" là gì?',
        options: ['Các em có vui không?', 'Em cảm thấy thế nào?', 'Cô tự hào về em!'],
        correctIndex: 0,
        explanationVi: '"Are you happy?" nghĩa là "Các em có vui không?".',
      },
    ],
    writing: {
      arrange: {
        id: 'L10-write-arr',
        tokens: ['happy', 'Are', '?', 'you'],
        correctSentence: 'Are you happy?',
      },
      complete: {
        id: 'L10-write-comp',
        promptTemplate: 'Are you ______?',
        missingWord: 'happy',
        acceptedWords: ['happy'],
        fullSentence: 'Are you happy?',
        hintVi: 'Tính từ 5 chữ cái, nghĩa là "vui vẻ / hạnh phúc".',
      },
      translate: {
        id: 'L10-write-trans',
        vietnamesePrompt: 'Các em có vui không?',
        referenceAnswer: 'Are you happy?',
        acceptedSynonyms: ['Are you happy?', 'Are you all happy?'],
        tipVi: 'Nhớ viết hoa chữ đầu "Are" và đặt dấu hỏi (?) ở cuối câu.',
      },
    },
  },
];

export const DECEMBER_PLAN_WEEKS = [
  {
    week: 1 as const,
    title: 'Week 1 – Praise and Encouragement',
    subtitleVi: 'Tuần 1: Khen ngợi & Khích lệ học sinh',
    lessonIds: [1, 2, 3],
  },
  {
    week: 2 as const,
    title: 'Week 2 – Motivation & Confidence',
    subtitleVi: 'Tuần 2: Động viên & Tự hào về học sinh',
    lessonIds: [4, 5],
  },
  {
    week: 3 as const,
    title: 'Week 3 – Classroom Interaction',
    subtitleVi: 'Tuần 3: Tương tác lớp học tích cực',
    lessonIds: [6, 7, 8],
  },
  {
    week: 4 as const,
    title: 'Week 4 – Feelings and Reflection',
    subtitleVi: 'Tuần 4: Quan tâm cảm xúc & Lớp học hạnh phúc',
    lessonIds: [9, 10],
  },
];

export interface FinalExamListeningItem {
  id: string;
  lessonId: number;
  audioText: string;
  options: string[];
  correctIndex: number;
}

export interface FinalExamReadingItem {
  id: string;
  lessonId: number;
  prompt: string;
  promptVi: string;
  options: string[];
  correctIndex: number;
}

export interface FinalExamWritingItem {
  id: string;
  lessonId: number;
  vietnamesePrompt: string;
  referenceAnswer: string;
  acceptedSynonyms: string[];
}

export const FINAL_EXAM_DATA: {
  listening: FinalExamListeningItem[];
  reading: FinalExamReadingItem[];
  writing: FinalExamWritingItem[];
  speakingLessonIds: number[];
} = {
  listening: [
    {
      id: 'FE-L1',
      lessonId: 1,
      audioText: 'Well done!',
      options: ['Well done!', 'Nice try!', 'Any ideas?'],
      correctIndex: 0,
    },
    {
      id: 'FE-L2',
      lessonId: 4,
      audioText: "Don't worry. You can do it!",
      options: ["I'm proud of you!", "Don't worry. You can do it!", 'Good voice and clear!'],
      correctIndex: 1,
    },
    {
      id: 'FE-L3',
      lessonId: 6,
      audioText: 'Are you ready?',
      options: ['Are you happy?', 'How do you feel?', 'Are you ready?'],
      correctIndex: 2,
    },
    {
      id: 'FE-L4',
      lessonId: 8,
      audioText: 'Good voice and clear!',
      options: ['Good voice and clear!', 'Great job!', 'Well done!'],
      correctIndex: 0,
    },
    {
      id: 'FE-L5',
      lessonId: 9,
      audioText: 'How do you feel?',
      options: ['Are you ready?', 'How do you feel?', 'Any ideas?'],
      correctIndex: 1,
    },
  ],
  reading: [
    {
      id: 'FE-R1',
      lessonId: 3,
      prompt: 'A student tries to answer a hard question but gets it slightly wrong. What do you say?',
      promptVi: 'Học sinh cố gắng trả lời câu hỏi khó nhưng hơi nhầm một chút. Cô nói gì?',
      options: ['Nice try!', 'Are you ready?', 'Are you happy?'],
      correctIndex: 0,
    },
    {
      id: 'FE-R2',
      lessonId: 5,
      prompt: 'Which sentence means "Cô tự hào về em!"?',
      promptVi: 'Câu tiếng Anh nào có nghĩa là "Cô tự hào về em!"?',
      options: ['Great job!', "I'm proud of you!", 'Good voice and clear!'],
      correctIndex: 1,
    },
    {
      id: 'FE-R3',
      lessonId: 7,
      prompt: 'You want students to share their creative thoughts. Which question fits best?',
      promptVi: 'Cô muốn mời học sinh chia sẻ ý tưởng sáng tạo. Câu hỏi nào phù hợp nhất?',
      options: ['How do you feel?', 'Well done!', 'Any ideas?'],
      correctIndex: 2,
    },
    {
      id: 'FE-R4',
      lessonId: 2,
      prompt: 'A team finishes their class poster beautifully. What is the best praise?',
      promptVi: 'Một nhóm học sinh hoàn thành xuất sắc sản phẩm nhóm. Lời khen nào phù hợp nhất?',
      options: ['Great job!', "Don't worry. You can do it!", 'How do you feel?'],
      correctIndex: 0,
    },
    {
      id: 'FE-R5',
      lessonId: 10,
      prompt: 'After a cheerful classroom game, how do you ask "Các em có vui không?"?',
      promptVi: 'Sau trò chơi vui nhộn, cô hỏi "Các em có vui không?" bằng tiếng Anh thế nào?',
      options: ['Are you ready?', 'Are you happy?', 'Any ideas?'],
      correctIndex: 1,
    },
  ],
  writing: [
    {
      id: 'FE-W1',
      lessonId: 1,
      vietnamesePrompt: 'Làm tốt lắm!',
      referenceAnswer: 'Well done!',
      acceptedSynonyms: ['Well done!', 'Good job!', 'Great job!'],
    },
    {
      id: 'FE-W2',
      lessonId: 4,
      vietnamesePrompt: 'Đừng lo lắng. Em làm được mà!',
      referenceAnswer: "Don't worry. You can do it!",
      acceptedSynonyms: [
        "Don't worry. You can do it!",
        "Do not worry. You can do it!",
        "Don't worry, you can do it!",
      ],
    },
    {
      id: 'FE-W3',
      lessonId: 5,
      vietnamesePrompt: 'Cô tự hào về em!',
      referenceAnswer: "I'm proud of you!",
      acceptedSynonyms: ["I'm proud of you!", 'I am proud of you!'],
    },
    {
      id: 'FE-W4',
      lessonId: 7,
      vietnamesePrompt: 'Có ý kiến nào không?',
      referenceAnswer: 'Any ideas?',
      acceptedSynonyms: ['Any ideas?', 'Do you have any ideas?'],
    },
    {
      id: 'FE-W5',
      lessonId: 10,
      vietnamesePrompt: 'Các em có vui không?',
      referenceAnswer: 'Are you happy?',
      acceptedSynonyms: ['Are you happy?', 'Are you all happy?'],
    },
  ],
  speakingLessonIds: [1, 4, 6, 8, 10],
};

export function getLessonById(id: number): LessonData {
  return LESSONS.find((l) => l.id === id) ?? LESSONS[0];
}
