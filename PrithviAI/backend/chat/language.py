"""
PrithviAI — Multi-Language Support
Handles translation of final outputs to Hindi (hi) and Marathi (mr).
Strategy: All reasoning in English, translate final output only.
"""

from models.schemas import Language


# ── Translation Dictionaries ──
# Key phrases and templates pre-translated for accuracy and speed.
# For production: use Google Translate API or Azure Translator.

TRANSLATIONS = {
    # ── Risk Levels ──
    "LOW": {
        "hi": "कम जोखिम",
        "mr": "कमी धोका",
    },
    "MODERATE": {
        "hi": "मध्यम जोखिम",
        "mr": "मध्यम धोका",
    },
    "HIGH": {
        "hi": "उच्च जोखिम",
        "mr": "उच्च धोका",
    },
    
    # ── Common Phrases ──
    "Safe to go outside": {
        "hi": "बाहर जाना सुरक्षित है",
        "mr": "बाहेर जाणे सुरक्षित आहे",
    },
    "Stay indoors": {
        "hi": "घर के अंदर रहें",
        "mr": "घरातच राहा",
    },
    "Drink plenty of water": {
        "hi": "खूब पानी पिएं",
        "mr": "भरपूर पाणी प्या",
    },
    "Avoid outdoor activity": {
        "hi": "बाहरी गतिविधि से बचें",
        "mr": "बाहेरील हालचाली टाळा",
    },
    "Use sunscreen and hat": {
        "hi": "सनस्क्रीन और टोपी का उपयोग करें",
        "mr": "सनस्क्रीन आणि टोपी वापरा",
    },
    "Air quality is poor": {
        "hi": "हवा की गुणवत्ता खराब है",
        "mr": "हवेची गुणवत्ता खराब आहे",
    },
    "Temperature is high": {
        "hi": "तापमान अधिक है",
        "mr": "तापमान जास्त आहे",
    },
    "Humidity is high": {
        "hi": "नमी अधिक है",
        "mr": "आर्द्रता जास्त आहे",
    },
    "It is raining": {
        "hi": "बारिश हो रही है",
        "mr": "पाऊस पडत आहे",
    },
    "UV is high": {
        "hi": "UV किरणें तेज हैं",
        "mr": "UV किरणे तीव्र आहेत",
    },
    "Noise level is high": {
        "hi": "शोर का स्तर अधिक है",
        "mr": "आवाजाची पातळी जास्त आहे",
    },
    "Conditions are safe for seniors": {
        "hi": "बुजुर्गों के लिए स्थिति सुरक्षित है",
        "mr": "ज्येष्ठ नागरिकांसाठी परिस्थिती सुरक्षित आहे",
    },
    "Consult a doctor if you feel unwell": {
        "hi": "अगर तबीयत खराब लगे तो डॉक्टर से मिलें",
        "mr": "बरे वाटत नसल्यास डॉक्टरांचा सल्ला घ्या",
    },
    "Senior Environmental Safety Index": {
        "hi": "वरिष्ठ पर्यावरण सुरक्षा सूचकांक",
        "mr": "ज्येष्ठ पर्यावरण सुरक्षा निर्देशांक",
    },
    "Good morning": {
        "hi": "सुप्रभात",
        "mr": "सुप्रभात",
    },
    "Today's safety summary": {
        "hi": "आज का सुरक्षा सारांश",
        "mr": "आजचा सुरक्षा सारांश",
    },
    
    # ── Risk Factor Names ──
    "Air Quality": {
        "hi": "वायु गुणवत्ता",
        "mr": "हवेची गुणवत्ता",
    },
    "Thermal Comfort": {
        "hi": "तापमान आराम",
        "mr": "तापमान आराम",
    },
    "Humidity": {
        "hi": "नमी",
        "mr": "आर्द्रता",
    },
    "UV Exposure": {
        "hi": "UV किरणें",
        "mr": "UV किरणे",
    },
    "Flood / Waterlogging": {
        "hi": "बाढ़ / जलभराव",
        "mr": "पूर / पाणी साचणे",
    },
    "Noise Pollution": {
        "hi": "ध्वनि प्रदूषण",
        "mr": "ध्वनी प्रदूषण",
    },
}

# ── Template Translations for Chat ──
CHAT_TEMPLATES = {
    "safe_response": {
        "en": "✅ {level} Risk — {summary} {recommendation}",
        "hi": "✅ {level} — {summary} {recommendation}",
        "mr": "✅ {level} — {summary} {recommendation}",
    },
    "moderate_response": {
        "en": "⚠️ {level} Risk — {summary} {recommendation}",
        "hi": "⚠️ {level} — {summary} {recommendation}",
        "mr": "⚠️ {level} — {summary} {recommendation}",
    },
    "high_response": {
        "en": "🔴 {level} Risk — {summary} {recommendation}",
        "hi": "🔴 {level} — {summary} {recommendation}",
        "mr": "🔴 {level} — {summary} {recommendation}",
    },
}


def translate_text(text: str, language: Language) -> str:
    """
    Translate text to the target language.
    Uses dictionary lookup for known phrases, returns original for unknown.
    
    For production: Integrate Google Translate API or Azure Translator.
    """
    if language == Language.ENGLISH:
        return text
    
    lang_code = language.value
    
    # Check exact match
    if text in TRANSLATIONS and lang_code in TRANSLATIONS[text]:
        return TRANSLATIONS[text][lang_code]
    
    # Check if text contains translatable phrases
    translated = text
    for eng_phrase, translations in TRANSLATIONS.items():
        if eng_phrase in translated and lang_code in translations:
            translated = translated.replace(eng_phrase, translations[lang_code])
    
    return translated


def translate_risk_level(level: str, language: Language) -> str:
    """Translate risk level label."""
    if language == Language.ENGLISH:
        return level
    return TRANSLATIONS.get(level, {}).get(language.value, level)


def get_chat_template(risk_level: str, language: Language) -> str:
    """Get the appropriate chat response template."""
    if risk_level == "LOW":
        template_key = "safe_response"
    elif risk_level == "MODERATE":
        template_key = "moderate_response"
    else:
        template_key = "high_response"
    
    return CHAT_TEMPLATES[template_key].get(language.value, CHAT_TEMPLATES[template_key]["en"])
