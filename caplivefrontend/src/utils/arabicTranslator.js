/**
 * Arabic Translation & Transliteration Utility for Cap Embroidery
 */

// Dictionary for common Danish and English names to accurate Arabic transliterations
const NAME_DICTIONARY = {
    // Common Names (Danish / English) -> Arabic Transliteration
    'christian': 'كريستيان',
    'kristian': 'كريستيان',
    'christina': 'كريستينا',
    'kristina': 'كريستينا',
    'christopher': 'كريستوفر',
    'kristoffer': 'كريستوفر',
    'alexander': 'الكسندر',
    'alex': 'أليكس',
    'sofie': 'صوفي',
    'sophie': 'صوفي',
    'sophia': 'صوفيا',
    'sofia': 'صوفيا',
    'emil': 'إميل',
    'emilie': 'إميلي',
    'emma': 'إيما',
    'oliver': 'أوليفر',
    'william': 'وليام',
    'lucas': 'لوكاس',
    'lukas': 'لوكاس',
    'luka': 'لوكا',
    'noah': 'نوح',
    'victor': 'فيكتور',
    'viktor': 'فيكتور',
    'victoria': 'فيكتوريا',
    'oscar': 'أوسكار',
    'oskar': 'أوسكار',
    'alma': 'ألما',
    'ida': 'إيدا',
    'clara': 'كلارا',
    'klara': 'كلارا',
    'ella': 'إيلا',
    'freja': 'فريا',
    'laura': 'لورا',
    'anna': 'آنا',
    'anne': 'آن',
    'mille': 'ميلي',
    'mathilde': 'ماتيلد',
    'matilde': 'ماتيلد',
    'camilla': 'كاميلا',
    'julie': 'جولي',
    'julia': 'جوليا',
    'sara': 'سارة',
    'sarah': 'سارة',
    'rasmus': 'راسموس',
    'jonas': 'يوناس',
    'mathias': 'ماتياس',
    'mattias': 'ماتياس',
    'magnus': 'ماجنوس',
    'mikkel': 'ميكيل',
    'mads': 'مادز',
    'kasper': 'كاسبر',
    'casper': 'كاسبر',
    'henrik': 'هنريك',
    'frederik': 'فريدريك',
    'sebastian': 'سباستيان',
    'benjamin': 'بنيامين',
    'daniel': 'دانيال',
    'david': 'داوود',
    'adam': 'آدم',
    'albert': 'ألبيرت',
    'alfred': 'ألفرد',
    'arthur': 'أرثر',
    'august': 'أوغست',
    'carl': 'كارل',
    'karl': 'كارل',
    'felix': 'فيليكس',
    'gustav': 'غوستاف',
    'jacob': 'يعقوب',
    'jakob': 'يعقوب',
    'liam': 'ليام',
    'louis': 'لويس',
    'malthe': 'مالثي',
    'marcus': 'ماركوس',
    'markus': 'ماركوس',
    'marius': 'ماريوس',
    'nicolai': 'نيكولاي',
    'nikolai': 'نيكولاي',
    'nikolaj': 'نيكولاج',
    'philip': 'فيليب',
    'samuel': 'صموئيل',
    'simon': 'سيمون',
    'tobias': 'طوبياس',
    'valdemar': 'فالدمار',
    'alberte': 'ألبيرت',
    'amalie': 'أمالي',
    'astrid': 'أسترايد',
    'caroline': 'كارولين',
    'karoline': 'كارولين',
    'cecilie': 'سيسيلي',
    'esther': 'أستير',
    'frida': 'فريدا',
    'hannah': 'هناء',
    'hanna': 'هناء',
    'isabella': 'إيزابيلا',
    'josefine': 'جوزفين',
    'josephine': 'جوزفين',
    'lærke': 'ليركه',
    'liv': 'ليف',
    'liva': 'ليفا',
    'maja': 'مايا',
    'maya': 'مايا',
    'marie': 'ماري',
    'nanna': 'نانا',
    'nicoline': 'نيكولين',
    'olivia': 'أوليفيا',
    'signe': 'سيني',
    'silke': 'سيلك',
    'thea': 'ثيا',
    'zara': 'زهرة',
    
    // Cap terms
    'student': 'طالب',
    'studine': 'طالبة',
    'kongen': 'الملك',
    'konge': 'ملك',
    'dronning': 'ملكة',
    'dronningen': 'الملكة',
    'skole': 'مدرسة',
    'klasse': 'صف'
};

/**
 * Checks if a string contains Arabic script characters
 */
export function isArabicText(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Translates input text (Danish / English) to accurate Arabic
 * @param {string} text - Input text
 * @param {number} maxLen - Maximum allowed length
 * @returns {Promise<string>} Translated Arabic text
 */
export async function translateTextToArabic(text, maxLen = 26) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // If already Arabic, return as is (trimmed to maxLen)
    if (isArabicText(trimmed)) {
        return trimmed.slice(0, maxLen);
    }

    const lower = trimmed.toLowerCase();

    // Check exact match in dictionary first (ideal for names like Christian -> كريستيان)
    if (NAME_DICTIONARY[lower]) {
        return NAME_DICTIONARY[lower].slice(0, maxLen);
    }

    // Try Google Translate API (gtx client endpoint)
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data[0] && Array.isArray(data[0])) {
                const translatedText = data[0].map(item => item[0]).join('');
                if (translatedText && translatedText.trim()) {
                    return translatedText.trim().slice(0, maxLen);
                }
            }
        }
    } catch (err) {
        console.warn('Google Translate API call failed, attempting fallback:', err);
    }

    // Fallback: MyMemory Translation API
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=da|ar`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data.responseData && data.responseData.translatedText) {
                const text = data.responseData.translatedText.trim();
                if (text && !text.includes('MYMEMORY WARNING')) {
                    return text.slice(0, maxLen);
                }
            }
        }
    } catch (err) {
        console.warn('MyMemory API call failed:', err);
    }

    // Word by word dictionary fallback
    const words = trimmed.split(/\s+/);
    const translatedWords = words.map(w => NAME_DICTIONARY[w.toLowerCase()] || w);
    return translatedWords.join(' ').slice(0, maxLen);
}
