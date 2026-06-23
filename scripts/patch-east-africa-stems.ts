/**
 * Draft batch: `east_africa` stems for all cultural-adaptive-v1 items (200).
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/patch-east-africa-stems.ts
 */
import fs from 'fs';
import path from 'path';

const EAST_AFRICA_STEMS: Record<string, string> = {
  // —— sensory_regulation ——
  'ca-v1-sensory_regulation-001':
    'Nikiwa mahali nimekaa au nimesimama, mara nyingi nahisi harufu za kawaida kabla ya watu wa karibu kusema chochote.',
  'ca-v1-sensory_regulation-002':
    'Nikiwa kwenye soko lenye msongamano, matatu iliyojaa, au mkusanyiko mkubwa, nachoka haraka kuliko nikifanya kazi hiyo hiyo mahali patulivu.',
  'ca-v1-sensory_regulation-003':
    'Nikikaa muda mrefu chini ya mwanga mkali wa kudumu, huanza kujisikia kutokuwa sawa au kuchoka.',
  'ca-v1-sensory_regulation-004':
    'Kelele zikizidi kunizunguka, huhama na kutafuta sehemu tulivu nikipata nafasi.',
  'ca-v1-sensory_regulation-005':
    'Nguo zikinisugua ngozi kwa ukwaruzo, hupoteza mwelekeo wa kile nilichotaka kumaliza.',
  'ca-v1-sensory_regulation-006':
    'Mabadiliko madogo ya joto au baridi hewani huyagundua mapema kuliko watu walio karibu.',
  'ca-v1-sensory_regulation-007':
    'Mtetemo mzito wa kudumu kutoka kwa injini, matatu, au mashine hunivutia haraka sana.',
  'ca-v1-sensory_regulation-008':
    'Mtu akiongea kwa sauti kubwa karibu na sikio langu, huhitaji mapumziko mafupi kabla sijarudi kawaida.',
  'ca-v1-sensory_regulation-009':
    'Uso au mkao wangu huonyesha pale kelele za mahali zinaponizidi.',
  'ca-v1-sensory_regulation-010':
    'Baada ya kipindi cha msisimko mwingi, nafanya vizuri tena baada ya muda wa utulivu.',
  'ca-v1-sensory_regulation-011':
    'Sauti ikiwa kubwa kupita kiasi kutoka kwa kifaa au spika, hupunguza sauti au huondoka nikiruhusiwa.',
  'ca-v1-sensory_regulation-012':
    'Muundo fulani wa chakula mdomoni hunivuta fikra wakati wa kula hata nikijaribu kuzingatia jambo jingine.',
  'ca-v1-sensory_regulation-013':
    'Nikipewa uchaguzi wa kiti, huchagua mbali na taa zinazometa au kufifia.',
  'ca-v1-sensory_regulation-014':
    'Sehemu yenye watu wengi au iliyo tulivu hubadilisha kidogo sana kiwango cha uchovu ninachohisi.',
  'ca-v1-sensory_regulation-015':
    'Naweza kukaa muda mrefu chini ya mwanga mkali wa kudumu bila usumbufu.',
  'ca-v1-sensory_regulation-016':
    'Mara nyingi hubaki pale pale hata kelele zinapoongezeka karibu nami.',
  'ca-v1-sensory_regulation-017':
    'Nguo zikinisugua kwa ukwaruzo, umakini wangu huvunjika kidogo sana.',
  'ca-v1-sensory_regulation-018':
    'Mabadiliko madogo ya joto au baridi hewani huwa hayanifikii mapema.',
  'ca-v1-sensory_regulation-019':
    'Mngurumo wa injini huingia nyuma ya mawazo na haukunivutii.',
  'ca-v1-sensory_regulation-020':
    'Maneno makali kwa sauti karibu nami hayayumbishi utulivu wangu sana.',
  'ca-v1-sensory_regulation-021':
    'Uso wangu hauonyeshi mara nyingi kwamba kelele zimenizidi.',
  'ca-v1-sensory_regulation-022':
    'Baada ya msongamano wa hisia, sihitaji ukimya mrefu kabla ya kufikiri vizuri tena.',
  'ca-v1-sensory_regulation-023':
    'Sauti kubwa sana mara chache hunifanya nipunguze sauti au niondoke.',
  'ca-v1-sensory_regulation-024':
    'Mabadiliko ya muundo wa chakula hunivuta mawazo kidogo sana.',
  'ca-v1-sensory_regulation-025':
    'Huchagua kiti bila kufikiria sana hatari ya taa kumeta.',

  // —— attention_focus ——
  'ca-v1-attention_focus-001':
    'Nikikusudia kubaki kwenye kazi moja, kelele za pembeni bado huninyakua umakini.',
  'ca-v1-attention_focus-002':
    'Shughuli ndogo za pembeni hugawanya muda wangu kabla ya kazi kuu kukamilika.',
  'ca-v1-attention_focus-003':
    'Maelekezo marefu hubaki wazi akilini mwangu ninapoyapokea.',
  'ca-v1-attention_focus-004':
    'Makosa ya kuandika au mistari iliyokosekana huonekana macho yangu yakikagua.',
  'ca-v1-attention_focus-005':
    'Arifa za simu hukatiza nilipokusudia kubaki makini na jambo lingine.',
  'ca-v1-attention_focus-006':
    'Mapumziko hayaondoi nafasi yangu kwenye kazi niliyokuwa nafanya.',
  'ca-v1-attention_focus-007':
    'Kazi mbili nyepesi kwa wakati mmoja haziwezi kunichanganya.',
  'ca-v1-attention_focus-008':
    'Karatasi ndogo au dokezo la simu hunisaidia kukumbuka hatua inayofuata.',
  'ca-v1-attention_focus-009':
    'Naweza kuelekeza usikivu kwa mtu mmoja hata kukiwa na mazungumzo ya pembeni.',
  'ca-v1-attention_focus-010':
    'Kazi ya mikono ninayoipenda inaweza kunifanya nisihisi muda unavyopita.',
  'ca-v1-attention_focus-011':
    'Kila nikibadili kifaa au zana, nahitaji muda mfupi kabla hatua inayofuata iwe wazi.',
  'ca-v1-attention_focus-012':
    'Nikichanganua maandishi kwa haraka, mstari ulio wazi unaweza kunipita.',
  'ca-v1-attention_focus-013':
    'Sauti ya nyuma huvunja kidogo sana kazi niliyoiwekea umakini.',
  'ca-v1-attention_focus-014':
    'Shughuli za pembeni husubiri hadi kazi kuu iishe.',
  'ca-v1-attention_focus-015':
    'Maelekezo marefu hufifia akilini kabla hayajaisha.',
  'ca-v1-attention_focus-016':
    'Ukaguzi wa kwanza wa fomu mara nyingi huacha makosa bila kuonekana.',
  'ca-v1-attention_focus-017':
    'Naweza kuzuia arifa zisivunje kipande cha umakini nilichojiwekea.',
  'ca-v1-attention_focus-018':
    'Baada ya mapumziko, kuanza tena huhisi kama kuanzia karibu mwanzo.',
  'ca-v1-attention_focus-019':
    'Kazi mbili nyepesi kwa pamoja huhisi zimejifunga badala ya kwenda laini.',
  'ca-v1-attention_focus-020':
    'Mara chache huhitaji dokezo ili kujua kinachofuata.',
  'ca-v1-attention_focus-021':
    'Mazungumzo ya nyuma huendelea kushindana nikijaribu kusikiliza sauti moja.',
  'ca-v1-attention_focus-022':
    'Ufahamu wa saa hubaki mkali hata nikizama kwenye kazi ya mikono.',
  'ca-v1-attention_focus-023':
    'Kubadilisha kutoka zana moja kwenda nyingine ni ya papo hapo kwangu.',
  'ca-v1-attention_focus-024':
    'Nikikagua mstari kwa mstari, mara chache siruki maandishi yanayoonekana.',
  'ca-v1-attention_focus-025':
    'Foleni ndefu huacha mada niliyochagua ikiwa thabiti akilini.',

  // —— temporal_pacing ——
  'ca-v1-temporal_pacing-001':
    'Ratiba ikibadilika ghafla, hurekebisha hatua zangu zinazofuata bila kuvurugika kwa muda mrefu.',
  'ca-v1-temporal_pacing-002':
    'Kusubiri foleni ndefu bila cha kufanya hunichosha.',
  'ca-v1-temporal_pacing-003':
    'Kwa muda wa mkutano uliokubaliwa, hufika ndani ya dirisha lililotarajiwa.',
  'ca-v1-temporal_pacing-004':
    'Muda nikikadiria chini ya uhalisia, huongeza nafasi ya muda badala ya kupaniki.',
  'ca-v1-temporal_pacing-005':
    'Kugawa kazi vipande na mapumziko ndio njia yangu ya kushughulikia kazi ndefu.',
  'ca-v1-temporal_pacing-006':
    'Tarehe ya mwisho iliyo wazi hunisukuma kukamilisha badala ya kunizuia kuanza.',
  'ca-v1-temporal_pacing-007':
    'Tarehe za mbele hupotea akilini bila kukumbushwa kwa maandishi au simu.',
  'ca-v1-temporal_pacing-008':
    'Kutoka mapumzikoni kurudi kazini si jambo la papo hapo kwangu.',
  'ca-v1-temporal_pacing-009':
    'Mgawanyo wazi wa majukumu huifanya kazi ya kikundi iwe haraka kuliko makadirio yangu ya kwanza.',
  'ca-v1-temporal_pacing-010':
    'Safari zenye foleni ya magari mara nyingi huchukua muda mrefu kuliko nilivyokadiria awali.',
  'ca-v1-temporal_pacing-011':
    'Mfuatano wa asubuhi usiobadilika hutuliza kuingia kwangu kwenye siku.',
  'ca-v1-temporal_pacing-012':
    'Mapengo yasiyotarajiwa huyageuza kuwa nafasi za mafanikio madogo.',
  'ca-v1-temporal_pacing-013':
    'Mabadiliko ya ghafla ya ratiba hunitoa mwelekeo kwanza, kisha ndipo nazoea.',
  'ca-v1-temporal_pacing-014':
    'Kusubiri muda mrefu bila shughuli ni rahisi kwa hali yangu ya moyo.',
  'ca-v1-temporal_pacing-015':
    'Watu wakati mwingine hunisubiri hata ninapokusudia kuwahi.',
  'ca-v1-temporal_pacing-016':
    'Kazi ikivuka muda uliopangwa, huanzisha hisia za kukimbizana na saa.',
  'ca-v1-temporal_pacing-017':
    'Huepuka kutumia vipima muda vya vipande kwenye kazi ndefu.',
  'ca-v1-temporal_pacing-018':
    'Muda wa mwisho hunikwamisha kufanya hatua ya kwanza.',
  'ca-v1-temporal_pacing-019':
    'Mara chache hukosa muda niliousikia kwa mdomo mara moja tu.',
  'ca-v1-temporal_pacing-020':
    'Mapumziko kuisha na kasi ya kazi kupanda hutokea mara moja kwangu.',
  'ca-v1-temporal_pacing-021':
    'Kazi za pamoja huongezeka muda wa saa kuliko mpango wangu.',
  'ca-v1-temporal_pacing-022':
    'Hata barabara zikiwa wazi, bado huweka akiba kubwa ya muda.',
  'ca-v1-temporal_pacing-023':
    'Mfuatano wa asubuhi unaweza kubadilika bila gharama kubwa kwangu.',
  'ca-v1-temporal_pacing-024':
    'Kusubiri waliochelewa hunimaliza nguvu bila matumizi yenye tija.',
  'ca-v1-temporal_pacing-025':
    'Nikipanga, muda wa kazi ya timu na ya peke yangu huonekana karibu sawa.',

  // —— conversation_rhythm ——
  'ca-v1-conversation_rhythm-001':
    'Mazungumzo yakigongana, husubiri pengo lililotulia kabla ya kuongea.',
  'ca-v1-conversation_rhythm-002':
    'Huingiza hoja yangu nikiwa tayari badala ya kusubiri ukimya kamili.',
  'ca-v1-conversation_rhythm-003':
    'Nikiona mtu anasubiri kuongea, hutulia ili apewe nafasi.',
  'ca-v1-conversation_rhythm-004':
    'Hukamilisha sentensi yangu kwanza kabla ya kufungua nafasi kwa wengine.',
  'ca-v1-conversation_rhythm-005':
    'Hupunguza kasi ya maneno nikiona uelewa ni mdogo.',
  'ca-v1-conversation_rhythm-006':
    'Kasi yangu ya kuongea hubaki ile ile hata nikiona sura za kutokuelewa.',
  'ca-v1-conversation_rhythm-007':
    'Baada ya kutoa maelekezo, huuliza swali dogo la kuthibitisha.',
  'ca-v1-conversation_rhythm-008':
    'Mara chache huomba ukaguzi wa haraka baada ya kueleza hatua.',
  'ca-v1-conversation_rhythm-009':
    'Nisiposikia vizuri, hutoa toleo fupi la pili kwa ufafanuzi.',
  'ca-v1-conversation_rhythm-010':
    'Jaribio langu la pili hutumia maneno marefu yale yale ya kwanza.',
  'ca-v1-conversation_rhythm-011':
    'Ishara za kimya za zamu ya kuongea huzielewa wazi.',
  'ca-v1-conversation_rhythm-012':
    'Ishara za mkono au kichwa kuhusu kusimama huenda zikapita bila kugundua.',
  'ca-v1-conversation_rhythm-013':
    'Sauti kuu ikiwa laini pamoja na kelele za pembeni bado naweza kusikiliza vizuri.',
  'ca-v1-conversation_rhythm-014':
    'Sauti kuu ikiwa ya chini huku kelele za pembeni zikiendelea, hupoteza mfuatano.',
  'ca-v1-conversation_rhythm-015':
    'Hutoa pauzi fupi ili sauti ya mwingine iingie kwenye mazungumzo.',
  'ca-v1-conversation_rhythm-016':
    'Huanzisha kuongea kwenye mianya midogo hata sentensi ya mwenzangu haijaisha kabisa.',
  'ca-v1-conversation_rhythm-017':
    'Baada ya kelele kubwa kama bodaboda kupita, hurudia neno muhimu kwa kasi ndogo.',
  'ca-v1-conversation_rhythm-018':
    'Baada ya chumba kuwa na kelele, sirudii neno muhimu.',
  'ca-v1-conversation_rhythm-019':
    'Mazungumzo yakigongana, huongea kwa sauti ya chini ili mkondo mmoja usikike.',
  'ca-v1-conversation_rhythm-020':
    'Mazungumzo yakigongana, huongeza sauti ili nipenyeze ujumbe.',
  'ca-v1-conversation_rhythm-021':
    'Hutumia ishara ya kuonyesha ninapoona maneno ya kawaida yanaweza yasitoshe.',
  'ca-v1-conversation_rhythm-022':
    'Huepuka kuonyesha kwa kidole hata pale ingetatua uelewa.',
  'ca-v1-conversation_rhythm-023':
    'Watu wakirukiana kuongea bila mpangilio, hupoteza mfuatano wa simulizi.',
  'ca-v1-conversation_rhythm-024':
    'Mpangilio wa zamu ukiwa wa vurugu haupotezi mfuatano wangu.',
  'ca-v1-conversation_rhythm-025':
    'Mtu akijisogeza kuongea, hurudi nyuma kidogo kumpa nafasi.',

  // —— structure_preference ——
  'ca-v1-structure_preference-001':
    'Kazi mpya ngumu huianza kwa maelezo yaliyopangwa.',
  'ca-v1-structure_preference-002':
    'Ratiba zilizo wazi hunifurahisha zaidi kuliko mipango ya dakika kwa dakika.',
  'ca-v1-structure_preference-003':
    'Kanuni rahisi zinazoonekana hunipa utulivu kwenye maeneo ya pamoja.',
  'ca-v1-structure_preference-004':
    'Vifaa vikikosekana, hupata mbadala papo hapo.',
  'ca-v1-structure_preference-005':
    'Kwa kutoka asubuhi, huandaa begi usiku wa kabla.',
  'ca-v1-structure_preference-006':
    'Wageni wa kushtukiza hunisumbua siku zenye orodha nyingi za kazi.',
  'ca-v1-structure_preference-007':
    'Sehemu za kudumu za vitu hufanya utafutaji kuwa wa haraka.',
  'ca-v1-structure_preference-008':
    'Huibua wasiwasi wangu ninapoona kanuni zilizoandikwa si sahihi.',
  'ca-v1-structure_preference-009':
    'Kuruka hatua hunivuruga pale mpangilio wa hatua unaathiri matokeo.',
  'ca-v1-structure_preference-010':
    'Kazi mpya ya ubunifu huanza na mfano wa kuiga.',
  'ca-v1-structure_preference-011':
    'Hugawa muda wa jumla kwa sehemu kabla ya kuanza kazi.',
  'ca-v1-structure_preference-012':
    'Kupanga kila kitu mapema ni raha ndogo kuliko kugundua ninapoendelea.',
  'ca-v1-structure_preference-013':
    'Huanzisha kazi ngumu bila maandalizi ya hatua zenye namba.',
  'ca-v1-structure_preference-014':
    'Hupendelea muundo thabiti kuliko kazi zinazoelea bila mpangilio.',
  'ca-v1-structure_preference-015':
    'Kanuni za pamoja zilizoandikwa hunipa faraja ndogo sana.',
  'ca-v1-structure_preference-016':
    'Kuanza kazi bila zana sahihi huwa kugumu kwangu.',
  'ca-v1-structure_preference-017':
    'Kuandaa begi asubuhi hiyo hiyo ndio kawaida yangu.',
  'ca-v1-structure_preference-018':
    'Wageni wanaodondoka bila taarifa huendana vizuri na kazi nilizopanga.',
  'ca-v1-structure_preference-019':
    'Kuacha vitu mahali popote ndio mazoea yangu.',
  'ca-v1-structure_preference-020':
    'Hurudisha mpangilio wa eneo langu la kazi kwa namna ile ile kati ya vipindi.',
  'ca-v1-structure_preference-021':
    'Mfuatano wa hatua huwa legevu akilini mwangu.',
  'ca-v1-structure_preference-022':
    'Nikijifunza kutengeneza kitu kipya, huanza na kujaribu huru kwanza.',
  'ca-v1-structure_preference-023':
    'Sikadirii muda wa kila kipande cha kazi mapema.',
  'ca-v1-structure_preference-024':
    'Hupanga kila kitu kwa mkupuo kabla ya kuchukua hatua.',
  'ca-v1-structure_preference-025':
    'Kumaliza kazi kunatangulia usafi mkali wa mpangilio.',

  // —— adaptability_change ——
  'ca-v1-adaptability_change-001':
    'Njia ya kazi ikibadilika ghafla katikati, hulalamika kwa muda mfupi tu kabla ya kuendelea.',
  'ca-v1-adaptability_change-002':
    'Njia nisizozizoea kwenda sehemu ninazozijua hunipendeza.',
  'ca-v1-adaptability_change-003':
    'Ratiba ikikatika siku ya kwanza, hunisumbua.',
  'ca-v1-adaptability_change-004':
    'Zana ikiharibika, huanza kutafuta mbadala mara moja.',
  'ca-v1-adaptability_change-005':
    'Mabadiliko ya mara kwa mara ya timu huhitaji vikao vya kuzoeana kwanza.',
  'ca-v1-adaptability_change-006':
    'Mvua au mabadiliko ya ghafla ya hali ya hewa hunisukuma kuweka mpango mbadala haraka.',
  'ca-v1-adaptability_change-007':
    'Wakati mwingine mazoea niliyozoea hushinda njia mpya iliyo bora.',
  'ca-v1-adaptability_change-008':
    'Kanuni mpya huhitaji sababu inayoeleweka ili nizifuate kwa uthabiti.',
  'ca-v1-adaptability_change-009':
    'Muonekano mpya wa mfumo au app hunihitaji muda wa kuuchunguza kwanza.',
  'ca-v1-adaptability_change-010':
    'Mpango ukifutwa, hubadili haraka na kuhamia jambo linalofuata lenye manufaa.',
  'ca-v1-adaptability_change-011':
    'Nikiona viungo nisivyozoea, huwa tayari kujaribu vyakula vipya.',
  'ca-v1-adaptability_change-012':
    'Baada ya mapumziko, mdundo wangu wa kila siku hurudi kwa urahisi.',
  'ca-v1-adaptability_change-013':
    'Mabadiliko ya njia katikati ya kazi hunikera kabla sijasonga mbele.',
  'ca-v1-adaptability_change-014':
    'Njia mbadala huonekana hazina ulazima kwangu.',
  'ca-v1-adaptability_change-015':
    'Pengo la ratiba siku ya kwanza halinitikisi.',
  'ca-v1-adaptability_change-016':
    'Kifaa kikiharibika, hukwama bila zana ile ile halisi.',
  'ca-v1-adaptability_change-017':
    'Hujisikia huru mara moja nikiwa na washiriki wapya wa timu au chama.',
  'ca-v1-adaptability_change-018':
    'Mabadiliko ya hali ya hewa huacha mapengo kwenye mpango wangu.',
  'ca-v1-adaptability_change-019':
    'Nikipata ushahidi wa kuboreka, hubadili tabia haraka.',
  'ca-v1-adaptability_change-020':
    'Kanuni mpya ikielezwa kwa maneno machache, hunitosha kuifuata.',
  'ca-v1-adaptability_change-021':
    'Muundo mpya wa mfumo hunifanya niwe mwepesi tangu siku ya kwanza.',
  'ca-v1-adaptability_change-022':
    'Mpango ukifutwa, hatua yangu inayofuata hubaki tupu.',
  'ca-v1-adaptability_change-023':
    'Hata nikielezewa jina, bado hukataa vyakula visivyozoeleka.',
  'ca-v1-adaptability_change-024':
    'Baada ya muda mbali, hurudi taratibu kwenye mdundo wa kawaida.',
  'ca-v1-adaptability_change-025':
    'Mchanganyiko usio wa kawaida unaweza kunisaidia kumaliza kazi hata bila vifaa sahihi.',

  // —— effort_recovery ——
  'ca-v1-effort_recovery-001':
    'Baada ya kazi ngumu, naweza kuendelea raundi nyingine baada ya kutembea kidogo.',
  'ca-v1-effort_recovery-002':
    'Baada ya kazi nzito hasa jua kali, hunywa maji na kupumzika kwa muda mfupi.',
  'ca-v1-effort_recovery-003':
    'Kazi muhimu lakini ya kuchosha haiwi kawaida kubaki bila kumalizika hadi usiku wa manane.',
  'ca-v1-effort_recovery-004':
    'Maumivu ya mwili hunifanya nipunguze ukubwa wa kazi inayofuata.',
  'ca-v1-effort_recovery-005':
    'Akili ikichoka, huhamia kazi rahisi za mikono.',
  'ca-v1-effort_recovery-006':
    'Usafi mkubwa huupanga kwa vipande ndani ya siku.',
  'ca-v1-effort_recovery-007':
    'Siku yenye mahitaji makubwa hunifanya nilale zaidi siku inayofuata.',
  'ca-v1-effort_recovery-008':
    'Mazungumzo marefu huyaendesha kwa mapumziko mafupi ya kuandika madokezo.',
  'ca-v1-effort_recovery-009':
    'Vipande vya muda vilivyowekwa hunibeba kwenye kazi za kuchosha.',
  'ca-v1-effort_recovery-010':
    'Hupumzika kula kabla ya dalili kama kutetemeka au kizunguzungu.',
  'ca-v1-effort_recovery-011':
    'Mafanikio madogo hustahili kushirikiwa kwa pongezi.',
  'ca-v1-effort_recovery-012':
    'Baada ya mabishano, huhitaji muda wa kuwa peke yangu ili kurejea sawa.',
  'ca-v1-effort_recovery-013':
    'Nikifeli, kazi hiyo huwekwa pembeni kwa muda mrefu.',
  'ca-v1-effort_recovery-014':
    'Sikai wala sinywi kati ya vipindi vya juhudi nzito.',
  'ca-v1-effort_recovery-015':
    'Kazi muhimu za kuchosha hubaki bila kukamilika kwa muda.',
  'ca-v1-effort_recovery-016':
    'Hata nikiumia, sipunguzi ukubwa wa kazi inayofuata.',
  'ca-v1-effort_recovery-017':
    'Uchovu wa akili hunikatisha kabisa kipande cha kazi.',
  'ca-v1-effort_recovery-018':
    'Usafi mkubwa hujaribu kuufanya kwa mkupuo mmoja.',
  'ca-v1-effort_recovery-019':
    'Muda wa usingizi hubaki ule ule hata baada ya siku ngumu.',
  'ca-v1-effort_recovery-020':
    'Ninaweza kukumbuka mazungumzo marefu bila kuandika chochote.',
  'ca-v1-effort_recovery-021':
    'Hubaki kwenye kazi za kuchosha bila kikomo cha muda.',
  'ca-v1-effort_recovery-022':
    'Huchelewesha kula hadi mwili ulalamike sana.',
  'ca-v1-effort_recovery-023':
    'Sherehe ndogo kati ya vipande vya kazi sizifanyi.',
  'ca-v1-effort_recovery-024':
    'Baada ya mazungumzo yenye mvutano, sihitaji muda wa kuwa peke yangu.',
  'ca-v1-effort_recovery-025':
    'Mapumziko mafupi ya macho mara chache hurudisha nguvu yangu.',

  // —— learning_expression ——
  'ca-v1-learning_expression-001':
    'Nikipewa onyesho la vitendo kwanza, hunielewa vizuri zaidi kuliko maelezo marefu ya maneno pekee.',
  'ca-v1-learning_expression-002':
    'Kusikia mpangilio wa hatua hunitosha hata bila picha.',
  'ca-v1-learning_expression-003':
    'Nikijifunza maneno mapya, huhitaji kuyarudia kwa sauti mara kadhaa.',
  'ca-v1-learning_expression-004':
    'Maswali ya mahali huyajibu kwa mchoro mdogo.',
  'ca-v1-learning_expression-005':
    'Nikiyaona matokeo ya kosa moja kwa moja, hujifunza vizuri.',
  'ca-v1-learning_expression-006':
    'Onyesho likienda haraka sana, huomba lirudiwe polepole.',
  'ca-v1-learning_expression-007':
    'Kipengele kinachojitokeza hunisaidia kukumbuka majina.',
  'ca-v1-learning_expression-008':
    'Kwenye simulizi zangu, mara nyingi huonyesha kitu kwa kidole.',
  'ca-v1-learning_expression-009':
    'Ukuta wa maandishi hunipoteza; orodha hunisaidia zaidi.',
  'ca-v1-learning_expression-010':
    'Nikijifunza mwendo mpya wa mwili, huanza kwa taratibu.',
  'ca-v1-learning_expression-011':
    'Duru ya majaribio hunifundisha kanuni za kikundi haraka zaidi.',
  'ca-v1-learning_expression-012':
    'Jedwali au mchoro wenye rangi hunifanya nilinganishe haraka.',
  'ca-v1-learning_expression-013':
    'Huhitaji kuangalia mara nyingi kabla ya kunakili mwendo wa mwili.',
  'ca-v1-learning_expression-014':
    'Maneno pekee hayatoshi kwangu nikijifunza utaratibu mpya.',
  'ca-v1-learning_expression-015':
    'Sihitaji kurudia kwa sauti maneno mapya ili niyakumbuke.',
  'ca-v1-learning_expression-016':
    'Sichori mchoro wa njia ninapoelekeza mahali.',
  'ca-v1-learning_expression-017':
    'Nikikosea majaribio, huhitaji kuongozwa tena ili kurekebisha.',
  'ca-v1-learning_expression-018':
    'Onyesho la kasi linalounganisha hatua hunifaa vizuri.',
  'ca-v1-learning_expression-019':
    'Situmii sana sura za watu kama ndoano za kumbukumbu.',
  'ca-v1-learning_expression-020':
    'Kwenye simulizi zangu, vitu halisi hujitokeza mara chache.',
  'ca-v1-learning_expression-021':
    'Maandishi mazito bila vipengele huniongoza vizuri.',
  'ca-v1-learning_expression-022':
    'Sihitaji kuanza mwendo mpya kwa polepole.',
  'ca-v1-learning_expression-023':
    'Kanuni za maneno kabla ya majaribio hunitosha.',
  'ca-v1-learning_expression-024':
    'Namba za kawaida hunitosha kulinganisha vitu.',
  'ca-v1-learning_expression-025':
    'Orodha ya maandishi hunifaa zaidi kuliko kutazama onyesho.',
};

const EXPECTED = 200;
const bankPath = path.join(process.cwd(), 'content', 'questions', 'cultural-adaptive-v1', 'bank.json');

function main(): void {
  const keys = Object.keys(EAST_AFRICA_STEMS);
  if (keys.length !== EXPECTED) {
    throw new Error(`Stem map has ${keys.length} entries, expected ${EXPECTED}`);
  }

  const rows = JSON.parse(fs.readFileSync(bankPath, 'utf8')) as Array<{
    id: string;
    dimension: string;
    variants: Record<string, string>;
  }>;

  let patched = 0;
  for (const row of rows) {
    const stem = EAST_AFRICA_STEMS[row.id];
    if (!stem) continue;
    if (row.variants.east_africa) {
      throw new Error(`${row.id} already has east_africa stem`);
    }
    row.variants.east_africa = stem;
    patched += 1;
  }

  if (patched !== EXPECTED) {
    throw new Error(`Expected ${EXPECTED} patches, got ${patched}`);
  }

  fs.writeFileSync(bankPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Patched ${patched} east_africa stems in ${bankPath}`);
}

main();
