const dailyQuotes = [
    {
      en: "The hypocrite; his talk is lovely, but his deed makes you sick. - Imam Ali (A.S)",
      ar: "المنافق قوله جميلٌ وفعله الداء الدخيل - الإمام علي (ع)"
    },
    {
      en: "Do not overdo laughing as it will diminish your esteem, and do not overdo joking as it will diminish your worth. - Imam Ali (A.S)",
      ar: "لَا تُكْثِرَنَّ الضَّحِكَ فَتَذْهَبَ هَيْبَتُكَ وَلَا الْمِزَاحَ فَيُسْتَخَفَّ بِكَ - الإمام علي (ع)"
    },
    {
      en: "Good character is an act of worship. - Imam Hussain (A.S)",
      ar: "الخُلق الحَسَن عبادةٌ - الإمام الحسين (ع)"
    },
    {
      en: "In the face of adversity, faith is the light that guides us. - Imam Ali (A.S)",
      ar: "في مواجهة الشدائد، الإيمان هو النور الذي يهدينا. - الإمام علي (ع)"
    },
    {
      en: "Your brother is the one who supports you in hardship. - Imam Ali (A.S)",
      ar: "أخوك من واساك في الشدّة. - الإمام علي (ع)"
    },
    {
      en: "O people, compete in noble virtues and hasten to attain noble rewards. - Imam Hussain (A.S)",
      ar: "أيّها الناس نافِسوا في المكارم وسارعوا في المغانِم - الإمام الحسين (ع)"
    },
    {
      en: "Be kind to the one who offends you, and you will lead him. - Imam Ali (A.S)",
      ar: "أحسن إلى المسيء تَسُده. - الإمام علي (ع)"
    },
    {
      en: "The downfall of intellects lies beneath the flashes of greed. - Imam Ali (A.S)",
      ar: "أكثر مصارع العقول تحت بروق الأطماع. - الإمام علي (ع)"
    },
    {
      en: "Discipline your children, it will benefit them. - Imam Ali (A.S)",
      ar: "أدّب عيالك تنفعهم. - الإمام علي (ع)"
    },
    {
      en: "A person's manners are better than his wealth. - Imam Ali (A.S)",
      ar: "أدب المرء خير من ذهبه. - الإمام علي (ع)"
    },
    {
      en: "Through kindness, a free man is enslaved. - Imam Ali (A.S)",
      ar: "بالبرّ يُسْتَعْبَد الحرّ. - الإمام علي (ع)"
    },
    {
      en: "Begin your day with good deeds to find happiness. - Imam Ali (A.S)",
      ar: "باكر بالخير تسعد. - الإمام علي (ع)"
    },
    {
      en: "The blessing of life is in good deeds. - Imam Ali (A.S)",
      ar: "بركة العمر في حسن العمل. - الإمام علي (ع)"
    },
    {
      en: "A person's affliction comes from his tongue. - Imam Ali (A.S)",
      ar: "بلاء الإنسان من اللسان. - الإمام علي (ع)"
    },
    {
      en: "The blessing of wealth lies in paying alms. - Imam Ali (A.S)",
      ar: "بركة المال في أداء الزكاة. - الإمام علي (ع)"
    },
    {
      en: "Be optimistic about good, and you will find it. - Imam Ali (A.S)",
      ar: "تفاءل بالخير تنله. - الإمام علي (ع)"
    },
    {
      en: "When asked about the steadfastness of faith, the answer was 'Piety' and its fading 'Greed'. - Imam Hussain (A.S)",
      ar: "سُئِلَ أميرُ المؤمنين صلوات الله عليه: ما ثِباتُ الإيمان؟ فقال: الورع، فقيل له: ما زواله؟ قال الطمع - الإمام الحسين (ع)"
    },
    {
      en: "Sharing food brings blessings. - Imam Ali (A.S)",
      ar: "تزاحم الأيدي على الطعام بركة. - الإمام علي (ع)"
    },
    {
      en: "A person's humility honors him. - Imam Ali (A.S)",
      ar: "تواضع المرء يكرمه. - الإمام علي (ع)"
    },
    {
      en: "Trust in Allah, and He will suffice you. - Imam Ali (A.S)",
      ar: "توكل على اللّه يكفيك. - الإمام علي (ع)"
    },
    {
      en: "The death of scholars is a breach in religion. - Imam Ali (A.S)",
      ar: "ثلمة الدين موت العلماء. - الإمام علي (ع)"
    },
    {
      en: "The stability of authority is through justice. - Imam Ali (A.S)",
      ar: "ثبات الملك بالعدل. - الإمام علي (ع)"
    },
    {
      en: "The garment of safety never wears out. - Imam Ali (A.S)",
      ar: "ثوب السلامة لا يبلى. - الإمام علي (ع)"
    },
    {
      en: "The reward of the hereafter is better than the pleasures of this world. - Imam Ali (A.S)",
      ar: "ثواب الآخرة خير من نعيم الدنيا. - الإمام علي (ع)"
    },
    {
      en: "The excellence of speech is in its brevity. - Imam Ali (A.S)",
      ar: "جودة الكلام في الاختصار. - الإمام علي (ع)"
    },
    {
      en: "Sit with the poor to increase your gratitude. - Imam Ali (A.S)",
      ar: "جالس الفقراء تزدد شكراً. - الإمام علي (ع)"
    },
    {
      en: "A good companion is a treasure. - Imam Ali (A.S)",
      ar: "جليس الخير غنيمة. - الإمام علي (ع)"
    },
    {
      en: "An evil companion is a devil. - Imam Ali (A.S)",
      ar: "جليس السوء شيطان. - الإمام علي (ع)"
    },
    {
      en: "Good manners are a treasure. - Imam Ali (A.S)",
      ar: "حسن الخلق غنيمة. - الإمام علي (ع)"
    },
    {
      en: "A person's profession is his treasure. - Imam Ali (A.S)",
      ar: "حرفة المرء كنز له. - الإمام علي (ع)"
    },
    {
      en: "A person's patience is his support. - Imam Ali (A.S)",
      ar: "حلم المرء عونه. - الإمام علي (ع)"
    },
    {
      en: "The adornment of men is good manners. - Imam Ali (A.S)",
      ar: "حلي الرجال الأدب. - الإمام علي (ع)"
    },
    {
      en: "Pride and wealth were roaming until they met trust in Allah, and they settled together. - Imam Hussain (A.S)",
      ar: "إنّ العِزّ والغنى خرجا يجولان فَلَقيا التوكّل فاستَوطَنا - الإمام الحسين (ع)"
    },
    {
      en: "The best of companions is the one who guides you to good. - Imam Ali (A.S)",
      ar: "خير الأصحاب من يسددك على الخير. - الإمام علي (ع)"
    },
    {
        en: "Be content with Allah’s decree and you will be the richest of people. - Imam Hussain (A.S)",
        ar: "سمعت جدّي رسول الله (صلى الله عليه وآله) يقول: وارْضَ بِقَسمِ الله تكن أغنى الناس - الإمام الحسين (ع)"
      },
      {
        en: "I awoke knowing that I have a Lord above me, fire before me, and death seeking me; matters rest in the hands of others. - Imam Hussain (A.S)",
        ar: "أصبحتُ ولِيَ ربٌّ فوقي، والنار أمامي والموت يطلبني والحساب محدقٌ بي، وأما مُرتهنٌ بعملي، لا أجد ما أحبّ، ولا أدفع ما أكره، والأمور بيد غيري، فإن شاءَ عذّبني، وإن شاء عفا عنّي، فأيّ فقير أفقر منّي - الإمام الحسين (ع)"
      },
      {
        en: "The believer takes Allah as his shield and His word as his mirror; from believers he gains subtlety and from his own self, intimacy. - Imam Hussain (A.S)",
        ar: "إنّ المؤمن اتّخذ الله عِصمَتَه، وقولَه مِرأته، فَمرَّةٌ ينظرُ في نعتِ المؤمنين، وتارةً يَنظُرُ في وصف المتجبّرين، فهو منه في لطائف، ومن نفسه في تعارف، ومن فَطِنَتِه في يقين، ومِن قُدسِه على تمكين - الإمام الحسين (ع)"
      },
      {
        en: "May Allah have mercy on Abazar; I say: Whoever relies on Allah’s best selection desires nothing beyond His choice. - Imam Hussain (A.S)",
        ar: "رحم الله تعالى أباذر، أمّا أنا فأقول: مَن اتكَلَ على حُسنِ اختيار الله تعالى له، لم يتمنّ غير ما اختاره الله عزّ وجل له - الإمام الحسين (ع)"
      },
      {
        en: "In the name of Allah, the Most Gracious, the Most Merciful. Whoever seeks Allah's pleasure at the expense of people, Allah will suffice him; and whoever seeks people's pleasure at the expense of Allah, Allah will consign him to people. - Imam Hussain (A.S)",
        ar: "بسم الله الرحمن الرحيم، أمّا بعد فإنّه من طلبَ رضا الله بسخط الناس كفاه الله أمورَ الناس، ومن طلب رضا الناس بسخطِ الله وكله الله إلى الناس، والسلام - الإمام الحسين (ع)"
      },
      {
        en: "When you leave your home, see in everyone the favor they bestow upon you. - Imam Hussain (A.S)",
        ar: "هو أن تخرُج من بيتك، فلا تَلقي أحداً إلا رأيتَ له الفضلَ عليك - الإمام الحسين (ع)"
      },
      {
        en: "On the Day of Judgment, when Ridwan, the guardian of Paradise, sees a group who did not pass through him, he will ask: 'Who are you and from where did you enter?' They will reply: 'We are the people whose servant of Allah kept our secret, and Allah admitted us secretly.' - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "إذا كان يوم القيامة نظر رضوان خازن الجنة إلى قوم لم يمروا به فيقول من أنتم و من أين دخلتم قال يقولون إياك عنا فإنا قوم عبدنا الله سرا فأدخلنا الله سرا - الإمام الصادق (ع)"
      },
      {
        en: "There is no good deed except that it has a clear reward in the Quran, except for the night prayer; for Allah, the Almighty, has not made its reward explicit due to its great significance. - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "ما من حسنة إلا و لها ثواب مبين في القرآن إلا صلاة الليل فإن الله عز اسمه لم يبين ثوابها لعظم خطرها - الإمام الصادق (ع)"
      },
      {
        en: "The Day of Judgment is the wedding of the pious. - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "القيامة عرس المتقين - الإمام الصادق (ع)"
      },
      {
        en: "The grave speaks every day: 'I am the house of exile, the house of loneliness, the house of decay; I am the grave, a garden of the gardens of Paradise or a pit among the pits of Hell.' - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "إن للقبر كلاما في كل يوم يقول أنا بيت الغربة أنا بيت الوحشة أنا بيت الدود أنا القبر أنا روضة من رياض الجنة أو حفرة من حفر النار - الإمام الصادق (ع)"
      },
      {
        en: "He who does not reflect upon death, his limited means, his abundant helplessness, his long stay in the grave, and his bewilderment on the Day of Judgment, has no good in him. - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "من لا يعتبر بالموت و قلة حيلته و كثرة عجزه و طول مقامه في القبر و تحيره في القيامة فلا خير فيه - الإمام الصادق (ع)"
      },
      {
        en: "He who dies laden with sins is greater than him who dies by a destined term; and he who lives through good deeds is greater than him who lives by longevity. - Imam Jaʿfar al-Ṣādiq (A.S)",
        ar: "من يموت بالذنوب أكثر ممن يموت بالآجال و من يعيش بالإحسان أكثر ممن يعيش بالأعمار - الإمام الصادق (ع)"
      },
      
  ];
  
  export default dailyQuotes;
  