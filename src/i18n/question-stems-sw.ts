/**
 * Swahili stems for the classic universal question bank (`content/questions/universal/*.json`).
 * IDs must match question `id`; missing keys fall back to English from the bank JSON.
 * Draft — pending native review. Wording tuned for East Africa where natural.
 */
export const QUESTION_STEMS_SW: Record<string, string> = {
  'F-core-001':
    'Unapofanya kazi juu ya kitu kinachokuvutia sana, unaweza kushikilia umakini wako kwa muda mrefu bila akili yako kutangatanga.',
  'F-core-002':
    'Kelele za mandhari, mwendo wa watu, au usumbufu mdogo huvuruga umakini wako kabisa kwa kawaida.',
  'F-core-003':
    'Dakika chache tu baada ya kuanza kazi inayohitaji umakini, mara nyingi unajikuta unafanya kitu kingine bila kukusudia.',
  'P-core-001':
    'Unapata urahisi kutambua sheria, utaratibu, au muundo uliofichika nyuma ya mifano halisi.',
  'P-core-002':
    'Michoro ya dhana au maelezo ya ishara pekee mara chache huonekana wazi isipokuwa yameunganishwa na mfano halisi.',
  'P-core-003':
    'Unapendelea maelekezo yanayoorodhesha hatua sahihi kuliko maelezo yanayosisitiza « wazo kubwa ».',
  'S-core-001':
    'Mwanga mkali wa jua, harufu kali, au maeneo yenye msongamano na kelele (kama sokoni) yanaweza kukufanya uhisi kumezwa haraka.',
  'S-core-002':
    'Unapata shida kuona msisimko wa kawaida wa hisia katika maeneo ya watu wengi; mara chache unakusumbua.',
  'S-core-003':
    'Mazungumzo mengi na kelele huonekana kama mandhari ya kawaida; mara chache vinakuchoshea nishati.',
  'E-core-001':
    'Baada ya masaa kadhaa katika mazingira ya kikundi yenye shughuli, kawaida unahitaji muda wa kimya peke yako kupata nguvu tena.',
  'E-core-002':
    'Kuwa karibu na watu wengi kwa muda mrefu huakisi kukupa nguvu badala ya kukuchoshea.',
  'E-core-003':
    'Unatazamia furaha matukio ya kijamii yanayofuata moja baada ya lingine siku hiyo hiyo na mara chache unajisikia « umechoka na watu ».',
  'R-core-001':
    'Kujua mpango mapema na kuwa na ratiba zinazotarajiwa kunakusaidia kuhisi utulivu na ufanisi.',
  'R-core-002':
    'Unapata raha kuweka mpango upya haraka ratiba zinapobadilika na mara chache unahisi hilo kuwa la msongo.',
  'R-core-003':
    'Unapendelea siku zisizo na mpangilio madhubuti na ahadi chache kuliko siku zilizogawanywa kwa vipindi vya muda.',
  'C-core-001':
    'Taarifa mpya zinapopingana na imani yako, unaweza kubadilisha mtazamo wako bila upinzani mkubwa ndani yako.',
  'C-core-002':
    'Ukishaamua jibu, unapata vigumu kurudi kulifikiria tena hata kama mtu analeta hoja nzuri ya kupinga.',
  'C-core-003':
    'Hali zisizo wazi ambazo hazina tafsiri moja ya « sahihi » zinakufanya usumbuke badala ya kukuvutia.',
  'T-core-001':
    'Kawaida una hisia wazi ya muda kazi zitachukua na mara chache hupoteza ufuatiliaji wa muda wakati muda wa mwisho unahitajika.',
  'T-core-002':
    'Masaa yanaweza kupita kama dakika unapozama kazini; mara nyingi unadhani muda uliopita ni mdogo kuliko ulivyo.',
  'T-core-003':
    'Mara nyingi unachelewa au unahitaji king\'ora kwa sababu hisia yako ya muda ndani ni dhaifu ikilinganishwa na saa.',
  'I-core-001':
    'Unatambua mapema unapokuwa na njaa, kiu, uchovu, au msongo wa mwili kabla haijawa kali.',
  'I-core-002':
    'Njaa ghafla, uchovu, au msongo mara nyingi vinakushangaza kwa sababu ishara za mapema zilikuwa rahisi kupuuzia.',
  'I-core-003':
    'Ishara za mwili wako huonekana hazina uwazi au « mbali » ikilinganishwa na yanayotokea karibu nawe.',
  'A-core-001':
    'Wazo moja mara nyingi huweka alama uhusiano mwingi wa pembeni, mifano, au njia za ziada ambazo hukupanga mapema.',
  'A-core-002':
    'Mawazo yako kawaida hubaki karibu na kazi unayofanya; kuruka kwa mawazo marefu huwa nadra au hayafai.',
  'A-core-003':
    'Unapendelea kushikilia muundo wa mstari badala ya kufuata mawazo ya kuvutia lakini nje ya mada.',
  'V-core-001':
    'Michoro, ramani, au picha za akilini mara nyingi hukusaidia kuelewa haraka kuliko maelezo marefu ya maneno pekee.',
  'V-core-002':
    'Unategemea zaidi lugha ya maneno au ya kuandikwa; picha huonekana za hiari badala ya kiini cha jinsi unavyofikiri.',
  'V-core-003':
    'Unapojifunza kitu kipya, unapendelea mlolongo wazi wa maneno kuliko mpangilio wa anga au wa picha.',
  'F-ref-001':
    'Unaweza kurudi kwa kazi ngumu baada ya ukatizaji na kuendelea mahali ulipoacha takriban.',
  'F-ref-002':
    'Kubadilisha kazi mara kwa mara huonekana kawaida zaidi kuliko kukaa muda mrefu bila kukatizwa.',
  'P-ref-001':
    'Unafurahia fumbo au michezo inayothawabisha kutambua mifumo ya siri ambayo wengine hawaoni.',
  'P-ref-002':
    'Mara chache unatafuta sheria ya kina zaidi mara taratibu « inapofanya kazi vya kutosha ».',
  'S-ref-001':
    'Muundo wa tabaka, manukato, au mwanga unaotetemeka unaweza kubaki akilini mwako muda mrefu baada ya kuugusa.',
  'S-ref-002':
    'Unaweza kupuuza msukosuko wa hisia kwa masaa bila kuhisi umepungukiwa nguvu.',
  'E-ref-001':
    'Mazungumzo ya ana kwa ana huwa rahisi kushikilia kuliko mazungumzo huru ya kikundi.',
  'E-ref-002':
    'Unatafuta mikusanyiko mikubwa (kama sherehe ya familia) unapohitaji kuongeza mhemko badala ya unapohitaji kupumzika.',
  'R-ref-001':
    'Orodha za ukaguzi na ratiba za maandishi hupunguza wasiwasi wako zaidi kuliko vikumbusho vya maneno pekee.',
  'R-ref-002':
    'Ratiba kali huonekana kukufinya hata zingeimarisha uratibu.',
  'C-ref-001':
    'Unaweza kushikilia tafsiri mbili za kuaminika za hali moja bila kulazimisha uamuzi wa haraka.',
  'C-ref-002':
    'Kubadilisha tabia huonekana karibu ugumu sawa na kutatua tatizo la kiufundi tangu mwanzo.',
  'T-ref-001':
    'Unagawa siku yako kwa akili kwa matukio ya « kabla / baada » badala ya kuangalia saa kila mara.',
  'T-ref-002':
    'Mara chache unafikiria muda kitu kilichochukua hadi mtu akuulize baadaye.',
  'I-ref-001':
    'Kutambua pumzi yako au mapigo ya moyo kunakusaidia kupima msongo kabla haujafikia kilele.',
  'I-ref-002':
    'Unagundua umeelewa zaidi kutokana na mabadiliko ya tabia (hasira) kuliko ishara za mapema za mwili.',
  'A-ref-001':
    'Mifano ya akilini na ulinganisho hujia moja kwa moja unapoweleza mawazo kwa wengine.',
  'A-ref-002':
    'Unahariri usemi wako kuondoa « miguu mingi sana » ya pembeni kabla haujazungumza kwa sauti.',
  'V-ref-001':
    'Unaweza kuzungusha au kupanga upya vitu akilini mwako unapoamua kama vitasimama katika nafasi.',
  'V-ref-002':
    'Orodha za maandishi ndiyo zana yako ya kwanza; kuchora au mifano ya anga huonekana hatua ya ziada.',
};
