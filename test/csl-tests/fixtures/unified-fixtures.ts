/// <reference types="zotero-types" />

import { FIXTURE_IDS } from './constants';
import type { CNETestFixture } from './types';

/**
 * Unified test fixtures for all languages
 *
 * All fixtures across Chinese, Japanese, and Korean are combined here
 * for centralized management and batch item creation in global setup.
 *
 * Each fixture uses the original script in main Zotero fields,
 * with romanization and translations in the Extra field as CNE metadata.
 */
export const ALL_FIXTURES: Record<string, CNETestFixture> = {
  // ============================================================================
  // Chinese Fixtures
  // ============================================================================

  [FIXTURE_IDS.ZHCN_HAO_1998_TANG]: {
    itemType: 'book',
    title: '唐后期五代宋初敦煌僧尼的社会生活',
    publisher: '中国社会科学出版社',
    place: 'Beijing',
    date: '1998',
    language: 'zh-CN',
    creators: [{
      firstName: '春文',
      lastName: '郝',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 郝
cne-creator-0-first-original: 春文
cne-creator-0-last-romanized: Hao
cne-creator-0-first-romanized: Chunwen
cne-title-original: 唐后期五代宋初敦煌僧尼的社会生活
cne-title-romanized: Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
cne-title-english: The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song
cne-publisher-romanized: Zhongguo shehui kexue chubanshe`
  },

  [FIXTURE_IDS.ZHCN_HUA_1999_QINGDAI]: {
    itemType: 'journalArticle',
    title: '清代以来三峡地区水旱灾害的初步研究',
    publicationTitle: '中国社会科学',
    volume: '1',
    pages: '168-179',
    date: '1999',
    language: 'zh-CN',
    creators: [{
      firstName: '林甫',
      lastName: '华',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 华
cne-creator-0-first-original: 林甫
cne-creator-0-last-romanized: Hua
cne-creator-0-first-romanized: Linfu
cne-title-original: 清代以来三峡地区水旱灾害的初步研究
cne-title-romanized: Qingdai yilai Sanxia diqu shuihan zaihai de chubu yanjiu
cne-title-english: A preliminary study of floods and droughts in the Three Gorges region since the Qing dynasty
cne-journal-original: 中国社会科学
cne-journal-romanized: Zhongguo shehui kexue`
  },

  [FIXTURE_IDS.ZHCN_BEIJING_AIRUSHENG_2011]: {
    itemType: 'dataset',
    title: '中国基本古籍库',
    publisher: '北京爱如生数字化技术研究中心',
    place: 'Beijing',
    date: '2011',
    url: 'http://server.wenzibase.com/dblist.jsp',
    language: 'zh-CN',
    creators: [{
      lastName: '北京爱如生数字化技术研究中心',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 北京爱如生数字化技术研究中心
cne-creator-0-last-romanized: Beijing Airusheng shuzihua jishu yanjiu zhongxin
cne-title-original: 中国基本古籍库
cne-title-romanized: Zhongguo jiben guji ku
cne-title-english: Database of Chinese Classic Ancient Books
cne-publisher-romanized: Beijing Airusheng shuzihua jishu yanjiu zhongxin`
  },

  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]: {
    itemType: 'film',
    genre: 'Film',
    title: '二十四城记',
    publisher: 'Cinema Guild',
    place: 'New York',
    date: '2010',
    language: 'zh-CN',
    creators: [{
      firstName: '樟柯',
      lastName: '贾',
      creatorType: 'director'
    }],
    extra: `cne-creator-0-last-original: 贾
cne-creator-0-first-original: 樟柯
cne-creator-0-last-romanized: Jia
cne-creator-0-first-romanized: Zhangke
cne-title-original: 二十四城记
cne-title-romanized: Ershisi cheng ji
cne-title-english: 24 City`
  },

  [FIXTURE_IDS.ZHCN_DU_2007_DUNHUANG]: {
    itemType: 'bookSection',
    title: '敦煌遗书用纸概况及浅析',
    bookTitle: '融攝与创新: 国际敦煌项目第六次会议论文集',
    publisher: '北京图书馆出版社',
    place: 'Beijing',
    date: '2007',
    pages: '67-84',
    language: 'zh-CN',
    creators: [
      {
        firstName: '伟生',
        lastName: '杜',
        creatorType: 'author'
      },
      {
        firstName: 'Shitian',
        lastName: 'Lin',
        creatorType: 'editor'
      },
      {
        firstName: 'Alastair',
        lastName: 'Morrison',
        creatorType: 'editor'
      }
    ],
    extra: `cne-creator-0-last-original: 杜
cne-creator-0-first-original: 伟生
cne-creator-0-last-romanized: Du
cne-creator-0-first-romanized: Weisheng
cne-creator-1-last-original: 林
cne-creator-1-first-original: 世田
cne-creator-1-last-romanized: Lin
cne-creator-1-first-romanized: Shitian
cne-title-original: 敦煌遗书用纸概况及浅析
cne-title-romanized: Dunhuang yishu yongzhi gaikuang ji qianxi
cne-title-english: An analysis and description of the use of paper in Dunhuang manuscripts
cne-container-title-original: 融攝与创新: 国际敦煌项目第六次会议论文集
cne-container-title-romanized: Rongshe yu chuangxin: guoji Dunhuang xiangmu diliuci huiyi lunwenji
cne-container-title-english: Tradition and innovation: Proceedings of the 6th International Dunhuang Project conservation conference
cne-publisher-romanized: Beijing tushuguan chubanshe`
  },

  [FIXTURE_IDS.ZHCN_SHA_2014_SHIKU]: {
    itemType: 'newspaperArticle',
    title: '石窟考古开辟敦煌学研究新领域',
    publicationTitle: '中国社会科学报',
    date: '2014-01-08',
    language: 'zh-CN',
    creators: [{
      firstName: '武田',
      lastName: '沙',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 沙
cne-creator-0-first-original: 武田
cne-creator-0-last-romanized: Sha
cne-creator-0-first-romanized: Wutian
cne-title-original: 石窟考古开辟敦煌学研究新领域
cne-title-romanized: Shiku kaogu kaipi Dunghuangxue yanjiu xinlingyu
cne-title-english: Cave archeology to open a new field for Dunhuang studies
cne-journal-original: 中国社会科学报
cne-journal-romanized: Zhongguo shehui kexuebao`
  },

  // ============================================================================
  // Japanese Fixtures
  // ============================================================================

  [FIXTURE_IDS.JA_ABE_1983_SAIGO]: {
    itemType: 'book',
    title: '最後の「日本人」 : 朝河貫一の生涯',
    publisher: 'Iwanami Shoten',
    place: 'Tōkyō',
    date: '1983',
    language: 'ja',
    creators: [
      {
        firstName: '善雄',
        lastName: '阿部',
        creatorType: 'author'
      },
      {
        firstName: '英生',
        lastName: '金子',
        creatorType: 'author'
      }
    ],
    extra: `cne-creator-0-last-original: 阿部
cne-creator-0-first-original: 善雄
cne-creator-0-last-romanized: Abe
cne-creator-0-first-romanized: Yoshio
cne-creator-1-last-original: 金子
cne-creator-1-first-original: 英生
cne-creator-1-last-romanized: Kaneko
cne-creator-1-first-romanized: Hideo
cne-title-original: 最後の「日本人」: 朝河貫一の生涯
cne-title-romanized: Saigo no "Nihonjin": Asakawa Kan'Ichi no shōgai
cne-title-english: The last 'Japanese': Life of Kan'ichi Asakawa`
  },

  [FIXTURE_IDS.JA_KONDO_2013_YALE]: {
    itemType: 'journalArticle',
    title: 'イェール大学所蔵播磨国大部庄関係文書について',
    publicationTitle: '東京大学史料編纂所研究紀要',
    volume: '23',
    pages: '1-22',
    date: '2013',
    language: 'ja',
    creators: [{
      firstName: '成一',
      lastName: '近藤',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 近藤
cne-creator-0-first-original: 成一
cne-creator-0-last-romanized: Kondō
cne-creator-0-first-romanized: Shigekazu
cne-title-original: イェール大学所蔵播磨国大部庄関係文書について
cne-title-romanized: Yēru Daigaku Shozō Harima no Kuni Ōbe no Shō Kankei Monjo ni Tsuite
cne-title-english: On Harima no Kuni Ōbe no Shō Kankei Monjo at Yale University Collection
cne-journal-original: 東京大学史料編纂所研究紀要
cne-journal-romanized: Tokyō Daigaku Shiryō Hensanjo Kenkyū Kiyō`
  },

  [FIXTURE_IDS.JA_OZU_1953_TOKYO]: {
    itemType: 'film',
    title: '東京物語',
    publisher: 'Shōchiku',
    date: '1953',
    language: 'ja-JP',
    creators: [{
      firstName: '安二郎',
      lastName: '小津',
      creatorType: 'director'
    }],
    extra: `cne-creator-0-last-original: 小津
cne-creator-0-first-original: 安二郎
cne-creator-0-last-romanized: Ozu
cne-creator-0-first-romanized: Yasujirō
cne-title-original: 東京物語
cne-title-romanized: Tōkyō Monogatari`
  },

  [FIXTURE_IDS.JA_YOSHIMI_2012_MOHITOTSU]: {
    itemType: 'bookSection',
    title: 'もう一つのメディアとしての博覧会: 原子力平和利用博の受容',
    bookTitle: '占領する眼・占領する声: CIE/USIS映画とVOAラジオ',
    publisher: 'Tōkyō Daigaku Shuppan',
    place: 'Tōkyō',
    date: '2012',
    pages: '291-315',
    creators: [{
      firstName: 'Shun\'ya',
      lastName: 'Yoshimi',
      creatorType: 'author'
    }],
    extra: `cne-title-original: もう一つのメディアとしての博覧会: 原子力平和利用博の受容
cne-title-romanized: Mōhitotsu no media to shite no hakurankai: Genshiryoku Heiwa Riyōhaku no juyō
cne-title-english: Expo as another media: reception of Atoms for Peace
cne-container-title-original: 占領する眼・占領する声: CIE/USIS映画とVOAラジオ
cne-container-title-romanized: Senryō suru me senryō suru koe: CIE/USIS eia to VOA rajio
cne-container-title-english: Occupying Eyes, Occupying Voices: CIE/USIS Films and VOA Radio in Asia during the Cold War`
  },

  // ============================================================================
  // Korean Fixtures
  // ============================================================================

  [FIXTURE_IDS.KO_KANG_1990_WONYUNG]: {
    itemType: 'book',
    title: '圓融과調和 : 韓國古代彫刻史의原理',
    publisher: 'Yŏrhwadang',
    place: 'Seoul',
    date: '1990',
    language: 'ko',
    creators: [{
      firstName: '友邦',
      lastName: '姜',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 姜
cne-creator-0-first-original: 友邦
cne-creator-0-last-romanized: Kang
cne-creator-0-first-romanized: U-bang
cne-title-original: 圓融과調和: 韓國古代彫刻史의原理
cne-title-romanized: Wŏnyung kwa chohwa: Han'guk kodae chogaksa ŭi wŏlli
cne-title-english: Synthesis and harmony: Principle of the history of ancient Korean sculpture`
  },

  [FIXTURE_IDS.KO_HAN_1991_KYONGHUNG]: {
    itemType: 'journalArticle',
    title: '憬興 의 生涯 에 관한 재고찰',
    publicationTitle: '佛敎學報',
    volume: '28',
    issue: '1',
    pages: '187-213',
    date: '1991',
    language: 'ko',
    creators: [{
      firstName: '泰植',
      lastName: '韓',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 韓
cne-creator-0-first-original: 泰植
cne-creator-0-last-romanized: Han
cne-creator-0-first-romanized: T'ae-sik
cne-title-original: 憬興 의 生涯 에 관한 재고찰
cne-title-romanized: Kyŏnghŭng ŭi saengae e kwanhan chae koch'al
cne-title-english: Re-examination of the life of Kyŏnghŭng
cne-journal-original: 佛敎學報
cne-journal-romanized: Pulgyo hakpo`
  },

  [FIXTURE_IDS.KO_HA_2000_TONGSAM]: {
    itemType: 'bookSection',
    title: '東三洞 貝塚 淨化地域 發掘成果',
    bookTitle: '考古學을통해본加耶',
    publisher: '한국 고고 학회',
    place: 'Seoul',
    date: '2000',
    pages: '111-133',
    language: 'ko',
    creators: [
      {
        firstName: '仁秀',
        lastName: '河',
        creatorType: 'author'
      },
      {
        lastName: '한국 고고 학회',
        creatorType: 'editor'
      }
    ],
    extra: `cne-creator-0-last-original: 河
cne-creator-0-first-original: 仁秀
cne-creator-0-last-romanized: Ha
cne-creator-0-first-romanized: In-su
cne-creator-1-last-original: 한국 고고 학회
cne-creator-1-last-romanized: Han'guk Kogo Hakhoe
cne-title-original: 東三洞 貝塚 淨化地域 發掘成果
cne-title-romanized: Tongsam-dong P'aech'ong chŏnghwa chiyŏk palgul sŏngkwa
cne-title-english: Result of the excavation on the shell mounds in Tongsam-dong purification region
cne-container-title-original: 考古學을통해본加耶
cne-container-title-romanized: Kogohak ŭl tonghae pon Kaya
cne-container-title-english: Kaya seen through archaeology
cne-publisher-romanized: Han'guk Kogo Hakhoe`
  },

  [FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG]: {
    itemType: 'newspaperArticle',
    title: '美서 광우병 발생하면 수입 중단',
    publicationTitle: '朝鮮日報',
    date: '2008-05-08',
    language: 'ko',
    creators: [{
      firstName: '용중',
      lastName: '주',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 주
cne-creator-0-first-original: 용중
cne-creator-0-last-romanized: Chu
cne-creator-0-first-romanized: Yong-jung
cne-title-original: 美서 광우병 발생하면 수입 중단
cne-title-romanized: Mi sŏ kwangupyŏng palsaeng hamyŏn suip chungdan
cne-title-english: Will suspend the import if mad cow disease attacks in the United States
cne-journal-original: 朝鮮日報
cne-journal-romanized: Chosŏn Ilbo`
  },

  [FIXTURE_IDS.KO_KIM_2020_COMMA]: {
    itemType: 'book',
    title: '한국의 전통 건축',
    publisher: '서울대학교출판부',
    place: 'Seoul',
    date: '2020',
    language: 'ko',
    creators: [{
      firstName: '민수',
      lastName: '김',
      creatorType: 'author'
    }],
    extra: `cne-creator-0-last-original: 김
cne-creator-0-first-original: 민수
cne-creator-0-last-romanized: Kim
cne-creator-0-first-romanized: Minsoo
cne-creator-0-options-force-comma: true
cne-title-original: 한국의 전통 건축
cne-title-romanized: Han'guk ŭi chŏnt'ong kŏnch'uk
cne-title-english: Traditional Architecture of Korea
cne-publisher-romanized: Sŏul Taehakkyo Ch'ulp'anbu`
  },

  // ============================================================================
  // English Fixtures (for testing non-CNE behavior)
  // ============================================================================

  [FIXTURE_IDS.EN_PETRIDES_2004_CONVULSIVE]: {
    itemType: 'bookSection',
    title: 'Convulsive Therapy',
    bookTitle: 'Catatonia: From Psychopathology to Neurobiology',
    publisher: 'American Psychiatric Association Publishing',
    date: '2004',
    language: 'en',
    creators: [
      {
        firstName: 'Georgios',
        lastName: 'Petrides',
        creatorType: 'author'
      },
      {
        firstName: 'Chitra',
        lastName: 'Malur',
        creatorType: 'author'
      },
      {
        firstName: 'Max',
        lastName: 'Fink',
        creatorType: 'author'
      },
      {
        firstName: 'Stanley N.',
        lastName: 'Caroff',
        creatorType: 'editor'
      },
      {
        firstName: 'Stephan C.',
        lastName: 'Mann',
        creatorType: 'editor'
      },
      {
        firstName: 'Andrew',
        lastName: 'Francis',
        creatorType: 'editor'
      }
    ]
    // No CNE data - all English names, should use default formatting
  },
};
