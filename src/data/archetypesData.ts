import { TasteArchetype } from '../types';

export const TASTE_ARCHETYPES: Record<string, TasteArchetype> = {
  'midnight-romantic': {
    id: 'midnight-romantic',
    name: '새벽 감성 낭만주의자',
    subtitle: 'Midnight Romanticist',
    badge: '🌙 감성 몽환파',
    description: '남들이 잠든 새벽, 가슴을 울리는 섬세한 서사와 여운 짙은 분위기에 깊게 빠져드는 취향입니다. 자극적인 연출보다는 인물의 미묘한 심리와 시적 은유가 담긴 작품을 사랑합니다.',
    quote: '“새벽 2시에 읽는 문장 하나가, 온종일 나를 흔든다.”',
    primaryColor: '#84A98C', // Sage Green
    secondaryColor: '#FF8B7E', // Coral Peach
    accentColor: '#FFD275', // Warm Sand
    bgGradient: 'from-[#84A98C]/15 via-[#FF8B7E]/15 to-[#FFD275]/20',
    tags: ['#새벽감성', '#잔잔한여운', '#섬세한심리', '#독립감성', '#시적미학'],
    dnaScores: {
      emotional: 92,
      stimulation: 35,
      depth: 88,
      plotDensity: 60,
      indieGem: 84,
      worldbuilding: 65,
    },
    characteristics: [
      '결말이 열린 채로 끝나는 영화나 소설의 여운을 며칠씩 곱씹습니다.',
      '대중적인 블록버스터보다 인물의 내면 묘사가 뛰어난 인디 작품에 꽂힙니다.',
      '서정적인 작화와 감성적인 OST가 작품 선택의 중요한 기준입니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '달까지 가자', reason: '현실적인 20대 청춘의 결핍과 온기를 담은 문체' },
      { category: '영화', itemTitle: '애프터썬 (Aftersun)', reason: '직접 말하지 않는 기억과 감정의 조각들' },
      { category: '웹툰', itemTitle: '숲속의 담', reason: '동화적이면서도 철학적인 위로와 아름다운 색채' },
    ],
    trendResistanceScore: 82,
  },
  'dopamine-suspense': {
    id: 'dopamine-suspense',
    name: '도파민 폭발 서스펜스 탐험가',
    subtitle: 'Adrenaline Plot Chaser',
    badge: '⚡ 몰입형 추리광',
    description: '숨 쉴 틈 없는 반전, 고도의 두뇌 싸움, 긴장감 넘치는 떡밥 회수에 열광하는 취향입니다. 다음 화를 안 누르고는 못 배기는 폭발적인 스토리 전개력을 중시합니다.',
    quote: '“예측할 수 없는 전개만이 나의 심장을 뛰게 한다.”',
    primaryColor: '#E07A5F', // Terracotta
    secondaryColor: '#FFD275', // Warm Mustard
    accentColor: '#84A98C', // Sage
    bgGradient: 'from-[#E07A5F]/15 via-[#FFD275]/15 to-[#84A98C]/15',
    tags: ['#숨막히는반전', '#두뇌싸움', '#타임루프', '#서스펜스', '#떡밥회수'],
    dnaScores: {
      emotional: 45,
      stimulation: 95,
      depth: 68,
      plotDensity: 94,
      indieGem: 70,
      worldbuilding: 85,
    },
    characteristics: [
      '뻔한 클리셰나 고구마 전개를 극도로 싫어하고 빠른 템포를 선호합니다.',
      '작품 속 숨겨진 복선과 단서를 분석하며 결말을 유추하는 것을 즐깁니다.',
      '한번 몰입하면 새벽까지 정주행을 멈추지 못하는 강한 집중력을 보입니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '봉제인형 살인사건', reason: '페이지터너의 정석, 촘촘한 트릭' },
      { category: '영화', itemTitle: '서치 (Searching)', reason: '스크린라이프 장르의 극한 몰입감' },
      { category: '웹툰', itemTitle: '피라미드 게임', reason: '심리전과 생존 서스펜스의 완벽한 결합' },
    ],
    trendResistanceScore: 68,
  },
  'cozy-healing': {
    id: 'cozy-healing',
    name: '포근한 일상 힐링 수집가',
    subtitle: 'Cozy Lifestyle Curator',
    badge: '🍃 무자극 평온파',
    description: '자극과 피로로 가득 찬 일상에서 벗어나, 따스한 온기와 소소한 행복을 전하는 작품에서 안식을 찾는 취향입니다. 맛있는 음식, 정다운 대화, 귀여운 일상을 사랑합니다.',
    quote: '“마음이 편안해지는 순간, 그것이 최고의 명작이다.”',
    primaryColor: '#4A7C59', // Forest Sage
    secondaryColor: '#FFD275', // Warm Butter
    accentColor: '#FF8B7E', // Soft Peach
    bgGradient: 'from-[#4A7C59]/15 via-[#FFD275]/20 to-[#84A98C]/15',
    tags: ['#무자극힐링', '#소확행', '#따뜻한일상', '#소프트휴먼', '#마음정화'],
    dnaScores: {
      emotional: 86,
      stimulation: 22,
      depth: 62,
      plotDensity: 38,
      indieGem: 80,
      worldbuilding: 50,
    },
    characteristics: [
      '악역이나 자극적인 갈등 구도 없이 인물 간의 선의와 배려가 돋보이는 작품을 찾습니다.',
      '요리, 캠핑, 여행, 동물, 식물 등 일상의 디테일이 살아있는 콘텐츠를 좋아합니다.',
      '지친 하루 끝에 켜두고 잠들어도 좋은 편안한 톤앤매너를 선호합니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '어서 오세요, 휴남동 서점입니다', reason: '지친 현대인을 보듬는 책과 사람 이야기' },
      { category: '영화', itemTitle: '리틀 포레스트', reason: '사계절 제철 요리와 맑은 공기 같은 힐링' },
      { category: '웹툰', itemTitle: '환생동물학교', reason: '눈물 핑 도는 사랑스러운 동물들의 성장' },
    ],
    trendResistanceScore: 78,
  },
  'cyber-sf-mystic': {
    id: 'cyber-sf-mystic',
    name: '디스토피아 SF 세계관 탐험가',
    subtitle: 'Cyber & Dystopia Mystic',
    badge: '🚀 차원문 개척자',
    description: '먼 미래의 우주, 사이버펑크, 인공지능과 인류의 철학적 공존 등 방대한 세계관과 독창적 설정에 매료되는 취향입니다. 과학적 상상력과 사회 비판적 시선을 즐깁니다.',
    quote: '“우리가 사는 세계 너머의 가능성을 탐구한다.”',
    primaryColor: '#5C6B73', // Warm Slate
    secondaryColor: '#84A98C', // Sage
    accentColor: '#FF8B7E', // Coral
    bgGradient: 'from-[#5C6B73]/15 via-[#84A98C]/15 to-[#FFD275]/15',
    tags: ['#SF세계관', '#사이버펑크', '#하드SF', '#철학적상상', '#디스토피아'],
    dnaScores: {
      emotional: 64,
      stimulation: 78,
      depth: 92,
      plotDensity: 82,
      indieGem: 88,
      worldbuilding: 98,
    },
    characteristics: [
      '작품 고유의 설정집, 세계관 지도, 독창적 룰이 탄탄할수록 더 큰 희열을 느낍니다.',
      '기술 발전 속 인간다움의 정의를 묻는 사유적인 질문에 반응합니다.',
      '남들이 어렵다고 피하는 하드 SF나 실험적인 그래픽 노블도 거침없이 도전합니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '우리가 빛의 속도로 갈 수 없다면', reason: '김초엽 작가의 다정하고 찬란한 SF 유니버스' },
      { category: '영화', itemTitle: '컨택트 (Arrival)', reason: '언어와 시간, 우주를 관통하는 압도적 사유' },
      { category: '웹툰', itemTitle: '미래의 골동품 가게', reason: '한국 토속 오컬트와 방대한 신화적 고증의 정점' },
    ],
    trendResistanceScore: 91,
  },
  'youth-highteen': {
    id: 'youth-highteen',
    name: '청춘 하이틴 성장 컬렉터',
    subtitle: 'Youth & High-teen Spirit',
    badge: '✨ 눈부신 청춘파',
    description: '서툴지만 반짝이는 10대·20대의 첫사랑, 뜨거운 우정, 꿈을 향해 달리는 성장통의 서사에 공감하는 취향입니다. 청량한 청춘의 온도를 마음 가득 채워주는 작품을 아낍니다.',
    quote: '“불완전해서 더 찬란한 우리의 시절.”',
    primaryColor: '#FF8B7E', // Coral Peach
    secondaryColor: '#FFD275', // Warm Sand
    accentColor: '#84A98C', // Sage
    bgGradient: 'from-[#FF8B7E]/15 via-[#FFD275]/15 to-[#84A98C]/15',
    tags: ['#청량청춘', '#성장통', '#첫사랑의열병', '#스포츠열정', '#학교우정'],
    dnaScores: {
      emotional: 90,
      stimulation: 62,
      depth: 60,
      plotDensity: 74,
      indieGem: 65,
      worldbuilding: 62,
    },
    characteristics: [
      '인물들의 서툰 감정선과 관계성의 미세한 변화에 깊게 몰입합니다.',
      '여름날의 햇살, 체육관, 자전거 등 청춘 특유의 시각적 미장센을 애정합니다.',
      '결핍을 지닌 주인공들이 서로를 만나 구원받고 성장하는 서사에 뭉클해집니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '아몬드', reason: '타인의 감정에 다가가는 소년의 따뜻한 성장기' },
      { category: '영화', itemTitle: '하나와 앨리스', reason: '이와이 슌지의 풋풋하고 투명한 청춘의 기록' },
      { category: '웹툰', itemTitle: '세기말 풋사과 보습학원', reason: '순수하고 귀여운 레트로 청춘 로맨스' },
    ],
    trendResistanceScore: 66,
  },
  'kitsch-indie-rebel': {
    id: 'kitsch-indie-rebel',
    name: '키치 & 서브컬처 인디 반항아',
    subtitle: 'Kitsch & Indie Cult Seeker',
    badge: '🎨 개성 만점 독창파',
    description: '남들이 다 보는 뻔한 메이저 콘텐츠는 No! 독특한 그림체, B급 병맛 센스, 풍자와 풍성한 서브컬처적 위트가 살아 숨 쉬는 숨겨진 인디 명작을 찾아다니는 진정한 문화 탐험가입니다.',
    quote: '“정답은 없어. 내가 꽂히면 그게 바로 걸작이야.”',
    primaryColor: '#D97706', // Warm Amber Clay
    secondaryColor: '#84A98C', // Sage Olive
    accentColor: '#FF8B7E', // Coral
    bgGradient: 'from-[#D97706]/15 via-[#84A98C]/15 to-[#FF8B7E]/15',
    tags: ['#B급명작', '#독특한그림체', '#서브컬처', '#블랙코미디', '#인디감성'],
    dnaScores: {
      emotional: 58,
      stimulation: 88,
      depth: 76,
      plotDensity: 65,
      indieGem: 98,
      worldbuilding: 78,
    },
    characteristics: [
      '조회수나 순위 밖의 독특한 인디 웹툰이나 독립 출판물을 직접 발굴할 때 짜릿함을 느낍니다.',
      '정형화된 연출을 파괴하는 키치하고 실험적인 예술적 시도를 높게 평가합니다.',
      'SNS 유행 밈에 휩쓸리지 않고 오직 자신의 직관적인 호불호로 작품을 판단합니다.',
    ],
    bestMatches: [
      { category: '소설', itemTitle: '보건교사 안은영', reason: '통통 튀는 상상력과 젤리를 퇴치하는 유쾌한 명작' },
      { category: '영화', itemTitle: '메기 (Maggie)', reason: '독창적인 앵글과 엉뚱한 매력의 한국 독립영화 정수' },
      { category: '웹툰', itemTitle: '스피릿 핑거스', reason: '나만의 색깔을 찾는 사랑스럽고 톡톡 튀는 명작' },
    ],
    trendResistanceScore: 96,
  },
};

export const DEFAULT_ARCHETYPE = TASTE_ARCHETYPES['midnight-romantic'];
