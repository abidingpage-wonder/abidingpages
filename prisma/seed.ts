import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config as loadDotenv } from 'dotenv'
import path from 'path'

loadDotenv({ path: path.resolve(process.cwd(), '.env.local') })

const connectionString = (process.env.DIRECT_URL || process.env.DATABASE_URL)!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── 주차별 안내문 (7개) ────────────────────────────────────────────────────
const WEEK_GUIDES = [
  {
    week: 1, keyword: '머무름', title: '익숙한 온기 속에서',
    subtitle: '물리적 이별 직후, 멍하고 먹먹한 상태를 그대로 받아주기',
    guide: '물리적 이별 직후, 아직은 모든 게 꿈만 같고 멍한 상태일 것입니다. 억지로 현실을 받아들이거나 슬픔을 증명하려 애쓰지 마세요. 이번 주는 그저 아이의 익숙한 온기가 남아있는 집안에서, 먹먹한 상태를 있는 그대로 가만히 받아주는 시간입니다.',
  },
  {
    week: 2, keyword: '쏟아냄', title: '참지 않고 소리 내어 울기',
    subtitle: '세상 눈치 보느라 억눌렀던 슬픔을 안전하게 배출하기',
    guide: '"동물인데 왜 저러냐"는 세상의 무심한 시선 때문에, 혹은 주변 사람들을 걱정시키지 않으려고 슬픔을 억누르고 계시진 않나요? 이곳은 당신의 슬픔을 절대 판단하지 않는 유일한 안전지대입니다. 이번 주는 참아왔던 눈물과 삼켰던 말들을 밖으로 완전히 쏟아내는 시간입니다.',
  },
  {
    week: 3, keyword: '마주함', title: '미안했던 밤들의 고백',
    subtitle: '가장 아프고 무거운 죄책감의 덩어리를 밖으로 꺼내는 시간',
    guide: '"내가 그때 다른 선택을 했다면 어땠을까?" 하며 매일 밤 스스로를 자책하고 계시진 않나요? 죄책감은 너무 고통스러워서 자꾸 피하고 싶지만, 밖으로 꺼내어 구체적으로 적어볼 때 비로소 그 무게가 가벼워지기 시작합니다. 이번 주는 내 마음을 가장 무겁게 짓누르고 있는 \'미안함의 응어리\'를 회피하지 않고 날것 그대로 털어놓는 시간입니다.',
  },
  {
    week: 4, keyword: '기억함', title: '너와 함께 걸었던 길',
    subtitle: '미안함의 프레임을 걷어내고, 아이와 함께한 전체 삶의 사랑을 복원하는 시간',
    guide: '마지막 아팠던 순간의 기억에만 갇혀 있기엔, 우리가 함께 나눈 사랑의 시간이 너무나도 깁니다. 이제 \'죄책감\'과 \'사랑\'을 분리해 볼 차례입니다. 그 아픈 선택의 이면에는 사실 아이를 더는 아프게 하고 싶지 않았던 당신의 깊은 사랑이 있었습니다. 이번 주는 미안함의 프레임을 고마움으로 바꾸며, 아이와 함께한 전체 삶의 서사를 아름답게 복원하는 시간입니다.',
  },
  {
    week: 5, keyword: '연결됨', title: '눈에 보이지 않아도 느껴지는 것',
    subtitle: '일상 속 아이의 흔적을 치료적 의식으로 전환하기',
    guide: '아이의 흔적이 가득한 집안을 마주하는 것이 여전히 두렵고 아프실 수 있습니다. 하지만 물건을 무작정 치우거나 회피하는 것은 마음을 더 공허하게 만듭니다. 이번 주는 아이의 물건과 공간에 \'추모\'라는 다정한 질서를 부여하는 주간입니다. 물건을 치우는 것이 아니라, 내 마음과 아이의 영혼이 가장 편안하게 머물 자리를 찾아주는 행동을 함께 시작해 봅니다.',
  },
  {
    week: 6, keyword: '다독임', title: '너를 닮은 마음으로 나를 돌보기',
    subtitle: '아이가 사랑했던 나의 일상을 조금씩 복구하기',
    guide: '상실감은 우리에게서 일상을 빼앗아 가고 무기력함을 남깁니다. 하지만 당신이 끼니를 거르고 밤새 잠들지 못할 때, 무지개다리 너머에서 당신을 가장 걱정스럽게 바라볼 존재는 누구일까요? 이번 주는 아이가 없는 일상에 조금씩 적응해 나가며, 세상에서 나를 가장 사랑해 주었던 아이의 눈빛을 닮은 마음으로 \'남겨진 나 자신\'을 다정하게 돌보아주는 시간입니다.',
  },
  {
    week: 7, keyword: '간직함', title: '내 마음속 가장 따뜻한 방에',
    subtitle: '아이를 영원히 내 삶의 동반자로 안착시키는 시간',
    guide: '지난 6주 동안 슬픔을 쏟아내고, 미안함을 고마움으로 바꾸며, 나만의 추모 의식을 만들어오느라 참 고생 많으셨습니다. 이제 49일간의 긴 여행을 마무리할 시간입니다. 아이는 사라지는 것이 아니라, 당신의 마음속에 가장 안전하고 따뜻한 모습으로 영원히 깃들게 됩니다. 이번 주는 아이에게 마지막 약속을 건네고, 무지개다리 너머에서 도착할 아이의 진심 어린 답장을 가슴에 품는 시간입니다.',
  },
]

// ── 49개 질문 ─────────────────────────────────────────────────────────────
const QUESTIONS = [
  // 1주차: 머무름
  { week: 1, day: 1, orderIndex: 1,  category: '문득 찾아오는 부재',           isRest: false, restGuide: null,
    content: '오늘 문득 집안에서 아이의 이름을 부를 뻔했거나, 아이를 돌아보려 했던 순간이 있었나요?' },
  { week: 1, day: 2, orderIndex: 2,  category: '문득 찾아오는 부재',           isRest: false, restGuide: null,
    content: '아이가 잠시 먼 여행을 떠났다고 생각한다면, 지금 그곳은 어떤 날씨일까요?' },
  { week: 1, day: 3, orderIndex: 3,  category: '감각의 기억',                  isRest: false, restGuide: null,
    content: '가만히 눈을 감고 아이의 보드라운 털끝이나 말랑한 발바닥의 감촉을 떠올려본다면 어떤 느낌인가요?' },
  { week: 1, day: 4, orderIndex: 4,  category: '감각의 기억',                  isRest: false, restGuide: null,
    content: '아이가 자주 누워있던 자리나 머물던 공간은 어디였나요? 지금 그 자리가 어떻게 느껴지나요?' },
  { week: 1, day: 5, orderIndex: 5,  category: '우리가 처음 자석처럼 끌린 날', isRest: false, restGuide: null,
    content: '아이를 처음 내 품에 안았던 날, 아이가 나에게 주었던 첫인상은 어땠나요?' },
  { week: 1, day: 6, orderIndex: 6,  category: '우리가 처음 자석처럼 끌린 날', isRest: false, restGuide: null,
    content: '아이가 간식을 기다릴 때 지었던 가장 엉뚱하고 웃긴 표정은 무엇이었나요?' },
  { week: 1, day: 7, orderIndex: 7,  category: '온기 속에 가만히 눕기', isRest: true,
    content: '오늘은 질문이 없습니다. 글을 쓰지 않아도 괜찮습니다. 아이가 가장 좋아하던 자리에 가만히 앉아보거나, 함께 듣던 조용한 음악을 한 곡 들어보세요. 어떤 생각이나 감정이 흘러가든 그저 가만히 머물러봅니다.',
    restGuide: '오늘은 질문이 없습니다. 글을 쓰지 않아도 괜찮습니다. 아이가 가장 좋아하던 자리에 가만히 앉아보거나, 함께 듣던 조용한 음악을 한 곡 들어보세요. 어떤 생각이나 감정이 흘러가든 그저 가만히 머물러봅니다.' },

  // 2주차: 쏟아냄
  { week: 2, day: 1, orderIndex: 8,  category: '박탈된 애도 마주하기',   isRest: false, restGuide: null,
    content: '아이가 떠난 뒤, 이 깊은 슬픔을 주변 누군가에게 편하게 말할 수 있었나요? 혹시 누군가의 시선이나 말 때문에 숨겨야만 했나요? 이곳에 마음껏 쏟아내 주세요.' },
  { week: 2, day: 2, orderIndex: 9,  category: '박탈된 애도 마주하기',   isRest: false, restGuide: null,
    content: '아이가 쓰던 밥그릇, 방석, 장난감을 바라볼 때 내 마음에 가득 차오르는 생각은 무엇인가요?' },
  { week: 2, day: 3, orderIndex: 10, category: '삼켜버린 말들',           isRest: false, restGuide: null,
    content: '아이가 곁에 없다는 현실이 온몸으로 실감 나서 가장 아프고 시린 순간은 하루 중 언제인가요?' },
  { week: 2, day: 4, orderIndex: 11, category: '삼켜버린 말들',           isRest: false, restGuide: null,
    content: '오늘 하루 동안 아이에게 꼭 전하고 싶었지만, 차마 입 밖으로 내지 못하고 삼킨 말이 있다면 무엇인가요?' },
  { week: 2, day: 5, orderIndex: 12, category: '소란스러웠던 우리의 행복', isRest: false, restGuide: null,
    content: '아이만 가졌던 독특하고 귀여운 습관이나, 내 관심을 끌기 위해 했던 엉뚱한 행동은 무엇인가요?' },
  { week: 2, day: 6, orderIndex: 13, category: '소란스러웠던 우리의 행복', isRest: false, restGuide: null,
    content: '아이가 사고뭉치처럼 굴어서 당황시키거나, 크게 웃게 만들었던 가장 기억에 남는 사건은 무엇인가요?' },
  { week: 2, day: 7, orderIndex: 14, category: '눈물의 방 청소',   isRest: true,
    content: '이번 한 주 동안 세상의 가면을 벗고 슬픔을 쏟아내느라 참 고생 많으셨습니다. 오늘은 글을 쓰는 창을 잠시 닫아두셔도 좋습니다. 따뜻한 물로 샤워를 하거나 맑은 공기를 마시며, 눈물로 가득했던 마음을 다정하게 토닥여주세요.',
    restGuide: '이번 한 주 동안 세상의 가면을 벗고 슬픔을 쏟아내느라 참 고생 많으셨습니다. 오늘은 글을 쓰는 창을 잠시 닫아두셔도 좋습니다. 따뜻한 물로 샤워를 하거나 맑은 공기를 마시며, 눈물로 가득했던 마음을 다정하게 토닥여주세요.' },

  // 3주차: 마주함
  { week: 3, day: 1, orderIndex: 15, category: '가슴속 가장 아픈 장면',    isRest: false, restGuide: null,
    content: '아이가 아프던 순간이나 마지막 이별의 순간 중, "내가 그때 그랬더라면" 하고 계속해서 후회하고 자책하게 되는 장면은 언제인가요?' },
  { week: 3, day: 2, orderIndex: 16, category: '가슴속 가장 아픈 장면',    isRest: false, restGuide: null,
    content: '그 순간, 혹은 아이가 떠난 뒤 의료진이나 주변 사람들에게 서운하거나 원망스러웠던 마음이 있었다면 솔직하게 적어주세요.' },
  { week: 3, day: 3, orderIndex: 17, category: '그때의 나를 안아주기',      isRest: false, restGuide: null,
    content: '그 아프고 무거운 선택을 내려야만 했던 순간, 결정을 내리던 나의 마음은 얼마나 외롭고 무거웠나요? 힘겨웠을 그때의 내 마음에 지금의 내가 귀를 기울인다면, 뭐라고 말해줄 수 있을까요?' },
  { week: 3, day: 4, orderIndex: 18, category: '그때의 나를 안아주기',      isRest: false, restGuide: null,
    content: '아이에게 꼭 사주고 싶었지만 끝내 사주지 못했거나, 해주지 못해 마음에 걸리는 아쉬움은 무엇인가요?' },
  { week: 3, day: 5, orderIndex: 19, category: '귀여운 심술의 기억',        isRest: false, restGuide: null,
    content: '아이가 집에 큰 사고를 쳤거나, 고집을 부릴 때 피우던 가장 귀엽고 엉뚱한 심술은 무엇이었나요?' },
  { week: 3, day: 6, orderIndex: 20, category: '귀여운 심술의 기억',        isRest: false, restGuide: null,
    content: '아이의 얼굴이나 몸 중에서 유난히 좋아해서 자꾸만 만지고 냄새 맡았던 \'최애 부위(킬링 포인트)\'는 어디였나요?' },
  { week: 3, day: 7, orderIndex: 21, category: '무거운 짐을 잠시 내려놓는 밤', isRest: true,
    content: '마음속 가장 아픈 고백들을 꺼내어놓느라 온몸에 힘이 다 빠지셨을 것입니다. 오늘은 글을 쓰지 않아도 괜찮습니다. 손을 가슴 위에 얹고 천천히 깊은숨을 세 번 쉬어보세요. 그리고 스스로에게 말해주세요. "너는 그때 할 수 있는 최선을 다했어."',
    restGuide: '마음속 가장 아픈 고백들을 꺼내어놓느라 온몸에 힘이 다 빠지셨을 것입니다. 오늘은 글을 쓰지 않아도 괜찮습니다. 손을 가슴 위에 얹고 천천히 깊은숨을 세 번 쉬어보세요. 그리고 스스로에게 말해주세요. "너는 그때 할 수 있는 최선을 다했어."' },

  // 4주차: 기억함
  { week: 4, day: 1, orderIndex: 22, category: '미안함의 진짜 이름',         isRest: false, restGuide: null,
    content: '그 아프고 고통스러운 선택을 내렸을 때, 내 깊은 마음속에 있었던 \'아이를 위했던 마음\'은 어떤 형태였나요? (예: 더는 아프지 않기를 바라는 마음, 덜 힘들기를 바라는 마음 등)' },
  { week: 4, day: 2, orderIndex: 23, category: '미안함의 진짜 이름',         isRest: false, restGuide: null,
    content: '아이와 함께한 시간 중, 가장 잘 해줬다고 생각하는 순간이 있다면 언제인가요?' },
  { week: 4, day: 3, orderIndex: 24, category: '서사의 전환 — 미안해에서 고마워로', isRest: false, restGuide: null,
    content: '아이에게 "미안해" 대신 "그때 내가 너를 이만큼 사랑해서 그랬어"라고 말한다면 뭐라고 적고 싶으세요? 세 가지만 적어보세요.' },
  { week: 4, day: 4, orderIndex: 25, category: '서사의 전환 — 미안해에서 고마워로', isRest: false, restGuide: null,
    content: '아이를 만나기 전의 나와 만난 후의 나를 비교해 본다면, 아이는 나의 삶을 어떻게 더 아름답게 바꾸어 놓았나요?' },
  { week: 4, day: 5, orderIndex: 26, category: '사람보다 더 사람 같던 날',   isRest: false, restGuide: null,
    content: '아이가 사람 말을 다 알아듣는 것처럼 행동했거나, 사람처럼 굴어서 깜짝 놀라게 했던 영리한 순간은 언제였나요?' },
  { week: 4, day: 6, orderIndex: 27, category: '사람보다 더 사람 같던 날',   isRest: false, restGuide: null,
    content: '만약 아이가 사람으로 태어났다면, 그 성격과 성향상 어떤 직업이 가장 잘 어울렸을 것 같나요?' },
  { week: 4, day: 7, orderIndex: 28, category: '미안함의 수레바퀴 멈추기', isRest: true,
    content: '"미안해"를 "고마워"로 바꾸어 보는 위대한 용기를 내어주셨습니다. 오늘은 글을 쓰는 대신, 사진첩에서 아이가 가장 편안하게 쉬고 있는 사진 한 장을 가만히 응시해 보세요. 그리고 마음속으로 나지막이 읊조려봅니다. "나에게 와줘서 고마웠어, 내 천사."',
    restGuide: '"미안해"를 "고마워"로 바꾸어 보는 위대한 용기를 내어주셨습니다. 오늘은 글을 쓰는 대신, 사진첩에서 아이가 가장 편안하게 쉬고 있는 사진 한 장을 가만히 응시해 보세요. 그리고 마음속으로 나지막이 읊조려봅니다. "나에게 와줘서 고마웠어, 내 천사."' },

  // 5주차: 연결됨
  { week: 5, day: 1, orderIndex: 29, category: '내 마음의 안전 기지 만들기', isRest: false, restGuide: null,
    content: '아이의 수많은 유품 중, 곁에 가장 오랫동안 소중하게 간직하고 싶은 보물 1호는 무엇인가요?' },
  { week: 5, day: 2, orderIndex: 30, category: '내 마음의 안전 기지 만들기', isRest: false, restGuide: null,
    content: '집안의 한 구역을 정해 아이의 사진, 좋아하던 물건, 혹은 작은 추모석을 놓아둘 \'나만의 작은 추모 공간\'을 마련해 볼까요? 그 자리는 어디가 좋을지 적어보세요.' },
  { week: 5, day: 3, orderIndex: 31, category: '텅 빈 시간 채우기',         isRest: false, restGuide: null,
    content: '아침저녁 밥을 주던 시간, 혹은 함께 산책을 나가던 시간처럼 아이의 빈자리가 가장 크게 느껴지는 \'텅 빈 시간대\'는 하루 중 언제인가요? 그 시간이 어떻게 느껴지나요?' },
  { week: 5, day: 4, orderIndex: 32, category: '텅 빈 시간 채우기',         isRest: false, restGuide: null,
    content: '그 시간에 가만히 앉아 아이를 향해 조용히 초를 켜거나, 차 한 잔을 마시며 편지를 읽는 등 오직 아이만을 생각하는 \'5분 추모 루틴\'을 만든다면 무엇을 하고 싶나요?' },
  { week: 5, day: 5, orderIndex: 33, category: '아이가 남긴 흔적들',         isRest: false, restGuide: null,
    content: '우리 아이가 살아생전 가지고 있었던, 다른 동물들은 절대 흉내 낼 수 없는 나만 아는 \'천재적인 능력\'이나 독특한 장기는 무엇이었나요?' },
  { week: 5, day: 6, orderIndex: 34, category: '아이가 남긴 흔적들',         isRest: false, restGuide: null,
    content: '길을 걷다 우연히 아이와 유난히 닮은 인형, 캐릭터, 혹은 다른 동물을 발견하고 나도 모르게 미소 지었던 순간이 있었나요?' },
  { week: 5, day: 7, orderIndex: 35, category: '향기 속에서 숨 고르기', isRest: true,
    content: '이번 주는 물건을 정리하고 공간을 만지며 마음의 에너지를 많이 쓰셨을 것입니다. 오늘은 글을 쓰는 창을 잠시 닫아두셔도 좋습니다. 아이의 추모 공간 앞에 가만히 앉아 따뜻한 향초나 인센스를 피워보세요. 연기가 피어오르듯, 내 마음에 가득했던 무거운 그리움도 머물다 흘러가도록 내버려 둡니다.',
    restGuide: '이번 주는 물건을 정리하고 공간을 만지며 마음의 에너지를 많이 쓰셨을 것입니다. 오늘은 글을 쓰는 창을 잠시 닫아두셔도 좋습니다. 아이의 추모 공간 앞에 가만히 앉아 따뜻한 향초나 인센스를 피워보세요. 연기가 피어오르듯, 내 마음에 가득했던 무거운 그리움도 머물다 흘러가도록 내버려 둡니다.' },

  // 6주차: 다독임
  { week: 6, day: 1, orderIndex: 36, category: '아이가 바라는 나의 모습', isRest: false, restGuide: null,
    content: '아이가 가장 좋아했던 나의 모습은 어떤 모습이었을까요? 가장 작고 사소한 일상을 하나 되살린다면 무엇을 가장 먼저 해보고 싶으세요? (예: 가볍게 산책하기, 이불 정리하기 등)' },
  { week: 6, day: 2, orderIndex: 37, category: '아이가 바라는 나의 모습', isRest: false, restGuide: null,
    content: '슬퍼하며 건강을 해치고 있는 모습을 본 아이가 앞발로 콕콕 누르며 말을 건낸다면, 어떤 표정으로 어떤 이야기를 건냈을까요?' },
  { week: 6, day: 3, orderIndex: 38, category: '새로운 습관의 시작',      isRest: false, restGuide: null,
    content: '아이와 이별한 후, 역설적이게도 내 삶에 새롭게 시작하게 되었거나 다짐하게 된 건강한 습관이나 변화가 있나요? (예: 유기견/유기묘 기부에 관심을 가지기, 매일 하늘 올려다보기 등)' },
  { week: 6, day: 4, orderIndex: 39, category: '새로운 습관의 시작',      isRest: false, restGuide: null,
    content: '언젠가 마음이 조금 더 단단해진다면, 아이와 함께 자주 가던 추억의 장소나 카페를 다시 편안하게 방문해 볼 수 있을까요? 그때의 내 모습을 상상해 보세요.' },
  { week: 6, day: 5, orderIndex: 40, category: '패셔니스타의 추억',       isRest: false, restGuide: null,
    content: '명절, 생일, 혹은 유난히 추웠던 겨울날 아이에게 옷을 입혔거나 귀여운 액세서리를 해주었을 때, 아이가 보여준 반응이나 가장 웃긴 사진의 비하인드 스토리는 무엇인가요?' },
  { week: 6, day: 6, orderIndex: 41, category: '패셔니스타의 추억',       isRest: false, restGuide: null,
    content: '아이가 자면서 냈던 방구 소리, 웅얼거리던 잠꼬대, 혹은 드르렁 골던 코 고는 소리 중 가장 그리운 \'귀여운 소음\'은 무엇인가요?' },
  { week: 6, day: 7, orderIndex: 42, category: '나에게 주는 위로의 한 끼', isRest: true,
    content: '나를 돌보는 일은 아이를 잊어가는 과정이 아니라, 아이가 남긴 사랑을 책임감 있게 지켜내는 일입니다. 오늘은 오직 나만을 위한 다정한 하루를 보내세요. 나를 진심으로 이해해 주는 소중한 사람과 짧은 통화를 나누거나, 좋아하는 책을 읽고, 좋아하는 음식을 천천히 음미해 봅니다.',
    restGuide: '나를 돌보는 일은 아이를 잊어가는 과정이 아니라, 아이가 남긴 사랑을 책임감 있게 지켜내는 일입니다. 오늘은 오직 나만을 위한 다정한 하루를 보내세요. 나를 진심으로 이해해 주는 소중한 사람과 짧은 통화를 나누거나, 좋아하는 책을 읽고, 좋아하는 음식을 천천히 음미해 봅니다.' },

  // 7주차: 간직함
  { week: 7, day: 1, orderIndex: 43, category: '네가 나에게 남겨준 유산',    isRest: false, restGuide: null,
    content: '아이가 나의 삶에 남겨준 가장 아름다운 사랑의 유산은 무엇인가요? (예: 조건 없는 사랑, 현재에 충실하는 법, 생명의 소중함 등)' },
  { week: 7, day: 2, orderIndex: 44, category: '네가 나에게 남겨준 유산',    isRest: false, restGuide: null,
    content: '먼 훗날 내가 삶을 다하고 무지개다리 건너에서 아이를 다시 만나는 날, 아이에게 가장 먼저 자랑스럽게 들려주고 싶은 내 삶의 모습은 어떤 모습인가요?' },
  { week: 7, day: 3, orderIndex: 45, category: '마음을 모아 전하는 깊은 진심', isRest: false, restGuide: null,
    content: '49일을 함께 걸어온 지금, 아이가 지금의 나에게 가장 해주고 싶은 말은 무엇일 것 같나요? 나도 아이에게 전하고 싶은 한 문장이 있다면 무엇인가요?' },
  { week: 7, day: 4, orderIndex: 46, category: '마음을 모아 전하는 깊은 진심', isRest: false, restGuide: null,
    content: '지금 눈에 보이지 않아도, 아이가 곁에서 바라보고 있다면 어떤 표정을 짓고 있을까요? 나도 마음을 담아 미소를 지어본다면 어떤 표정인가요?' },
  { week: 7, day: 5, orderIndex: 47, category: '영원한 수호천사와의 약속',   isRest: false, restGuide: null,
    content: '이제 나의 마음속 방에 영원히 입주한 우리 아이에게, 앞으로 부를 \'새로운 비밀 별명\'을 지어준다면 무엇인가요? (예: 나의 수호천사, 든든한 빽, 마음속 귀요미)' },
  { week: 7, day: 6, orderIndex: 48, category: '영원한 수호천사와의 약속',   isRest: false, restGuide: null,
    content: '앞으로 일상을 살아가다 문득 아이가 보고 싶을 때, 슬퍼하는 대신 아이를 기리기 위해 하늘을 보며 지어줄 \'나만의 시그니처 미소나 제스처\'를 정해볼까요?' },
  { week: 7, day: 7, orderIndex: 49, category: '우리의 추억북 발행',  isRest: true,
    content: '직접 적어 내려간 눈물과 미소의 기록들, 그리고 아이의 사진들이 한 권의 추억북으로 발간되었습니다. 마음이 흔들릴 때 언제든 이 책을 열어보세요. 슬픔을 정면으로 마주했던 그 위대한 용기의 기록이, 앞으로의 삶을 지탱해 줄 단단한 힘이 되어줄 것입니다. "우리는 깊이 사랑했어. 그리고 앞으로도 계속 함께할 거야."',
    restGuide: '직접 적어 내려간 눈물과 미소의 기록들, 그리고 아이의 사진들이 한 권의 추억북으로 발간되었습니다. 마음이 흔들릴 때 언제든 이 책을 열어보세요. 슬픔을 정면으로 마주했던 그 위대한 용기의 기록이, 앞으로의 삶을 지탱해 줄 단단한 힘이 되어줄 것입니다. "우리는 깊이 사랑했어. 그리고 앞으로도 계속 함께할 거야."' },
] as const

async function main() {
  console.log('🌱 Seeding started...')

  // 기존 데이터 초기화 (재실행 안전)
  await prisma.weekGuide.deleteMany()
  await prisma.question.deleteMany()

  // WeekGuide 삽입
  await prisma.weekGuide.createMany({ data: WEEK_GUIDES })
  console.log(`✅ WeekGuide: ${WEEK_GUIDES.length}개 삽입`)

  // Question 삽입 (isComma = isRest alias)
  const questionData = QUESTIONS.map(q => ({
    week:       q.week,
    day:        q.day,
    orderIndex: q.orderIndex,
    category:   q.category,
    content:    q.content ?? '',
    isRest:     q.isRest,
    restGuide:  q.restGuide ?? null,
    stage:      q.week,     // 호환용 stage = week
    isComma:    q.isRest,   // isRest alias
  }))

  await prisma.question.createMany({ data: questionData })
  console.log(`✅ Question: ${questionData.length}개 삽입`)

  console.log('🎉 Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
