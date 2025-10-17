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
    extra: `cne-author-0-last-original: 郝
cne-author-0-first-original: 春文
cne-author-0-last-romanized: Hao
cne-author-0-first-romanized: Chunwen
cne-title-original: 唐后期五代宋初敦煌僧尼的社会生活
cne-title-romanized: Tang houqi wudai Songchu Dunhuang sengni de shehui shenghuo
cne-title-english: The social existence of monks and nuns in Dunhuang during the late Tang, Five Dynasties and early Song
cne-publisher-original: 中国社会科学出版社
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
    extra: `cne-author-0-last-original: 华
cne-author-0-first-original: 林甫
cne-author-0-last-romanized: Hua
cne-author-0-first-romanized: Linfu
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
    extra: `cne-author-0-last-original: 北京爱如生数字化技术研究中心
cne-author-0-last-romanized: Beijing Airusheng shuzihua jishu yanjiu zhongxin
cne-title-original: 中国基本古籍库
cne-title-romanized: Zhongguo jiben guji ku
cne-title-english: Database of Chinese Classic Ancient Books`
  },

  [FIXTURE_IDS.ZHCN_JIA_2010_ERSHISI]: {
    itemType: 'film',
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
    extra: `cne-director-0-last-original: 贾
cne-director-0-first-original: 樟柯
cne-director-0-last-romanized: Jia
cne-director-0-first-romanized: Zhangke
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
    creators: [{
      firstName: '伟生',
      lastName: '杜',
      creatorType: 'author'
    }],
    extra: `cne-author-0-last-original: 杜
cne-author-0-first-original: 伟生
cne-author-0-last-romanized: Du
cne-author-0-first-romanized: Weisheng
cne-title-original: 敦煌遗书用纸概况及浅析
cne-title-romanized: Dunhuang yishu yongzhi gaikuang ji qianxi
cne-title-english: An analysis and description of the use of paper in Dunhuang manuscripts
cne-booktitle-original: 融攝与创新: 国际敦煌项目第六次会议论文集
cne-booktitle-romanized: Rongshe yu chuangxin: guoji Dunhuang xiangmu diliuci huiyi lunwenji
cne-booktitle-english: Tradition and innovation: Proceedings of the 6th International Dunhuang Project conservation conference
cne-publisher-original: 北京图书馆出版社
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
    extra: `cne-author-0-last-original: 沙
cne-author-0-first-original: 武田
cne-author-0-last-romanized: Sha
cne-author-0-first-romanized: Wutian
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
    extra: `cne-author-0-last-original: 阿部
cne-author-0-first-original: 善雄
cne-author-0-last-romanized: Abe
cne-author-0-first-romanized: Yoshio
cne-author-1-last-original: 金子
cne-author-1-first-original: 英生
cne-author-1-last-romanized: Kaneko
cne-author-1-first-romanized: Hideo
cne-title-original: 最後の「日本人」 : 朝河貫一の生涯
cne-title-romanized: Saigo no "Nihonjin" : Asakawa Kan'Ichi no shōgai
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
    extra: `cne-author-0-last-original: 近藤
cne-author-0-first-original: 成一
cne-author-0-last-romanized: Kondō
cne-author-0-first-romanized: Shigekazu
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
    language: 'ja',
    creators: [{
      firstName: '安二郎',
      lastName: '小津',
      creatorType: 'director'
    }],
    extra: `cne-director-0-last-original: 小津
cne-director-0-first-original: 安二郎
cne-director-0-last-romanized: Ozu
cne-director-0-first-romanized: Yasujirō
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
cne-booktitle-original: 占領する眼・占領する声: CIE/USIS映画とVOAラジオ
cne-booktitle-romanized: Senryō suru me senryō suru koe : CIE/USIS eia to VOA rajio
cne-booktitle-english: Occupying Eyes, Occupying Voices: CIE/USIS Films and VOA Radio in Asia during the Cold War`
  },

  // ============================================================================
  // Korean Fixtures
  // ============================================================================

  [FIXTURE_IDS.KO_KANG_1990_WONYUNG]: {
    itemType: 'book',
    title: 'Wŏnyung kwa chohwa: Han\'guk kodae chogaksa ŭi wŏlli',
    publisher: 'Yŏrhwadang',
    place: 'Seoul',
    date: '1990',
    creators: [{
      firstName: 'U-bang',
      lastName: 'Kang',
      creatorType: 'author'
    }],
    extra: `cne-title-romanized: Wŏnyung kwa chohwa: Han'guk kodae chogaksa ŭi wŏlli
cne-title-english: Synthesis and harmony: Principle of the history of ancient Korean sculpture`
  },

  [FIXTURE_IDS.KO_HAN_1991_KYONGHUNG]: {
    itemType: 'journalArticle',
    title: 'Kyŏnghŭng ŭi saengae e kwanhan chae koch\'al',
    publicationTitle: 'Pulgyo hakpo',
    volume: '28',
    issue: '1',
    pages: '187-213',
    date: '1991',
    creators: [{
      firstName: 'T\'ae-sik',
      lastName: 'Han',
      creatorType: 'author'
    }],
    extra: `cne-title-romanized: Kyŏnghŭng ŭi saengae e kwanhan chae koch'al
cne-title-english: Re-examination of the life of Kyŏnghŭng`
  },

  [FIXTURE_IDS.KO_HA_2000_TONGSAM]: {
    itemType: 'bookSection',
    title: 'Tongsam-dong P\'aech\'ong chŏnghwa chiyŏk palgul sŏngkwa',
    bookTitle: 'Kogohak ŭl tonghae pon Kaya',
    publisher: 'Han\'guk Kogo Hakhoe',
    place: 'Seoul',
    date: '2000',
    pages: '111-133',
    creators: [{
      firstName: 'In-su',
      lastName: 'Ha',
      creatorType: 'author'
    }],
    extra: `cne-title-romanized: Tongsam-dong P'aech'ong chŏnghwa chiyŏk palgul sŏngkwa
cne-title-english: Result of the excavation on the shell mounds in Tongsam-dong purification region
cne-booktitle-romanized: Kogohak ŭl tonghae pon Kaya
cne-booktitle-english: Kaya seen through archaeology`
  },

  [FIXTURE_IDS.KO_CHU_2008_KWANGUPYONG]: {
    itemType: 'newspaperArticle',
    title: 'Mi sŏ kwangupyŏng palsaeng hamyŏn suip chungdan',
    publicationTitle: 'Chosŏn Ilbo',
    date: '2008-05-08',
    creators: [{
      firstName: 'Yong-jung',
      lastName: 'Chu',
      creatorType: 'author'
    }],
    extra: `cne-title-romanized: Mi sŏ kwangupyŏng palsaeng hamyŏn suip chungdan
cne-title-english: Will suspend the import if mad cow disease attacks in the United States`
  },
};
