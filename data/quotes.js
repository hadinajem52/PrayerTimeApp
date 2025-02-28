const dailyQuotes = [
// 1
{
  en: "Inquiry is the sect of criticism - Imam Ali (A.S)",
  ar: "الاستقصاء فرقة الانتقاد - الإمام علي (ع)"
},
// 2
{
  en: "The enmity of lack of patience is the scandal of disclosing secrets - Imam Ali (A.S)",
  ar: "عداوة قلة الصبر فضيحة إفشاء السر - الإمام علي (ع)"
},
// 3
{
  en: "The downfall of generosity is the acuteness of blame - Imam Ali (A.S)",
  ar: "سقوط السخاء فطنة اللوم - الإمام علي (ع)"
},
// 4
{
  en: "He who adheres to these three attains his desire in this world and the hereafter: clinging to God, accepting His decree, and having the best opinion of Him - Imam Ali (A.S)",
  ar: "ثلاثة من تمسك بهن نال من الدنيا والآخرة بغيته: من اعتصم بالله، ورضي بقضاء الله، وأحسن الظن بالله - الإمام علي (ع)"
},
// 5
{
  en: "Excess in these three leads to deprivation of a generous host, scholarly companionship, and the allure of authority - Imam Ali (A.S)",
  ar: "ثلاثة من فرط فيهن كان محروما: استماحة جواد، ومصاحبة عالم، واستمالة سلطان - الإمام علي (ع)"
},
// 6
{
  en: "Three things bestow love: true religion, humility, and generosity - Imam Ali (A.S)",
  ar: "ثلاثة تورث المحبة: الدين، والتواضع، والبذل - الإمام علي (ع)"
},
// 7
{
  en: "He who is free of three vices attains three blessings: being free of evil brings honor; being free of arrogance brings dignity; and being free of miserliness brings nobility - Imam Ali (A.S)",
  ar: "من برئ من ثلاثة نال ثلاثة: من برئ من الشر نال العز، ومن برئ من الكبر نال الكرامة، ومن برئ من البخل نال الشرف - الإمام علي (ع)"
},
// 8
{
  en: "Three traits breed hatred: hypocrisy, oppression, and conceit - Imam Ali (A.S)",
  ar: "ثلاثة مكسبة للبغضاء: النفاق، والظلم، والعجب - الإمام علي (ع)"
},
// 9
{
  en: "He who lacks one of these three qualities is not considered noble: without an illuminating intellect, a noble lineage, or supportive kinship - Imam Ali (A.S)",
  ar: "ومن لم تكن فيه خصلة من ثلاثة لم يعد نبيلا: من لم يكن له عقل يزينه، أو جدة تغنيه، أو عشيرة تعضده - الإمام علي (ع)"
},
// 10
{
  en: "Three things make a man prone to envy, slander, and rashness - Imam Ali (A.S)",
  ar: "ثلاثة تزري بالمرء الحسد والنميمة والطيش - الإمام علي (ع)"
},
// 11
{
  en: "Only in three circumstances does one truly reveal his character: the patient is known only in anger, the brave only in battle, and a true brother only in need - Imam Ali (A.S)",
  ar: "ثلاثة لا تعرف إلا في ثلاثة مواطن: لا يعرف الحليم إلا عند الغضب، ولا الشجاع إلا عند الحرب، ولا أخ إلا عند الحاجة - الإمام علي (ع)"
},
// 12
{
  en: "He who exhibits any of these three traits is a hypocrite—even if he fasts and prays: he lies when he speaks, breaks his promises, and betrays trust - Imam Ali (A.S)",
  ar: "ثلاث من كن فيه فهو منافق وإن صام وصلى: من إذا حدث كذب، وإذا وعد أخلف، وإذا اؤتمن خان - الإمام علي (ع)"
},
// 13
{
  en: "Beware of three types of people: the traitor, the oppressor, and the slanderer; for one who betrays you will betray you, one who oppresses will oppress you, and one who gossips will gossip about you - Imam Ali (A.S)",
  ar: "احذر من الناس ثلاثة: الخائن، والظلوم، والنمام؛ لأن من خان لك خانك، ومن ظلم لك سيظلمك، ومن نم إليك سينم عليك - الإمام علي (ع)"
},
// 14
{
  en: "A person is not truly trustworthy unless he is entrusted with three responsibilities—over wealth, secrets, and intimate matters—and if he fails in one, he is not worthy of trust - Imam Ali (A.S)",
  ar: "لا يكون الأمين أمينا حتى يؤتمن على ثلاثة: الأموال، والأسرار، والفروج؛ وإن حفظ اثنين وضيع واحدة فليس بأمين - الإمام علي (ع)"
},
// 15
{
  en: "Do not consult a fool, rely on a liar, or trust a lackluster friend; for a liar brings the distant near and the near far, a fool exhausts himself without achieving your desires, and a disloyal friend betrays you - Imam Ali (A.S)",
  ar: "لا تشاور أحمق ولا تستعن بكذاب ولا تثق بمودة ملول؛ فإن الكذاب يقرب لك البعيد ويبعد لك القريب، والأحمق يجهد لك نفسه ولا يبلغ ما تريد، والملول أوثق ما كنت به خذلك وأوصل ما كنت له قطعك - الإمام علي (ع)"
},
// 16
{
  en: "Four things never satiate: a land without sufficient rain, an eye that never sees enough, a woman who never fulfills her worth, and a scholar whose knowledge is never complete - Imam Ali (A.S)",
  ar: "أربعة لا تشبع: من أربعة أرض من مطر، وعين من نظر، وأنثى من ذكر، وعالم من علم - الإمام علي (ع)"
},
// 17
{
  en: "Four things deteriorate prematurely: eating rotten meat, idling in gossip, climbing stairs without purpose, and the company of the elderly - Imam Ali (A.S)",
  ar: "أربعة تهرم قبل أوان الهرم: أكل القديد، والقعود على النداوة، والصعود في الدرج، ومجامعة العجوز - الإمام علي (ع)"
},
// 18
{
  en: "Women fall into three categories: one is exclusively yours (the virgin), one is both yours and your responsibility (the chaste), and one is upon you but not yours (the one who bears another's child) - Imam Ali (A.S)",
  ar: "النساء ثلاث: فواحدة لك، وواحدة لك وعليك، وواحدة عليك لا لك؛ فأما التي هي لك فالمرأة العذراء، وأما التي هي لك وعليك فالثيب، وأما التي هي عليك لا لك فهي المتبع التي لها ولد من غيرك - الإمام علي (ع)"
},
// 19
{
  en: "Three qualities elevate a man to mastery: restraining his anger, forgiving the wrongdoer, and maintaining the bond between his self and his wealth - Imam Ali (A.S)",
  ar: "ثلاثة من كن فيه كان سيدا: كظم الغيظ، والعفو عن المسيء، والصلة بالنفس والمال - الإمام علي (ع)"
},
// 20
{
  en: "Everyone is bound by three things: just as the generous experiences a stumble, the sword must have a point, and the patient has a slight error - Imam Ali (A.S)",
  ar: "ثلاثة لا بد لهم من ثلاث: لا بد للجواد من كبوة، وللسيف من نبوة، وللحليم من هفوة - الإمام علي (ع)"
},
// 21
{
  en: "Eloquence is revealed in three aspects: approaching the true meaning with clarity, avoiding empty verbiage, and indicating much with little - Imam Ali (A.S)",
  ar: "ثلاثة فيهن البلاغة: التقرب من معنى البغية، والتبعد عن حشو الكلام، والدلالة بالقليل على الكثير - الإمام علي (ع)"
},
// 22
{
  en: "Salvation lies in three things: restraining your tongue, having a sufficient home, and repenting for your sins - Imam Ali (A.S)",
  ar: "النجاة في ثلاث: تمسك عليك لسانك، ويسعك بيتك، وتندم على خطيئتك - الإمام علي (ع)"
},
// 23
{
  en: "Ignorance is manifested in three ways: a change in true friendship, slander without reason, and prying into what is not one’s concern - Imam Ali (A.S)",
  ar: "الجهل في ثلاث: تبدل الإخوان، والمنابذة بغير بيان، والتجسس عما لا يعني - الإمام علي (ع)"
},
// 24
{
  en: "He who possesses deceit, treachery, and rebelliousness fulfills the very warnings of God—indeed, the wicked plot against themselves; as He says, 'The mischief of the wicked does not prevail except against themselves,' and 'O people, your rebellion is nothing but your own worldly amusement' - Imam Ali (A.S)",
  ar: "ثلاث من كن فيه: المكر، والنكث، والبغي؛ وذلك قول الله: 'ولا يحِيقُ الْمَكْرُ السَّيِّئُ إِلَّا بِأَهْلِهِ فَانْظُرْ كَيْفَ كانَ عاقِبَةُ مَكْرِهِمْ'، وقوله: 'يا أَيُّهَا النَّاسُ إِنَّما بَغْيُكُمْ عَلَى أَنْفُسِكُمْ مَتَاعُ الدُّنْيَا' - الإمام علي (ع)"
},
// 25
{
  en: "Three factors hinder a man from achieving high aspirations: low ambition, lack of resourcefulness, and weak judgment - Imam Ali (A.S)",
  ar: "ثلاثة يحجزن المرء عن طلب المعالي: قصر الهمة، وقلة الحيلة، وضعف الرأي - الإمام علي (ع)"
},
// 26
{
  en: "Firmness is found in three things: the proper exercise of authority, obedience to one’s parents, and submission to God - Imam Ali (A.S)",
  ar: "الحزم في ثلاثة: الاستخدام للسلطان، والطاعة للوالد، والخضوع للمولى - الإمام علي (ع)"
},
// 27
{
  en: "True comfort is achieved through three blessings: a compatible wife, a dutiful child, and a sincere friend - Imam Ali (A.S)",
  ar: "الأنس في ثلاث: الزوجة الموافقة، والولد البار، والصديق المصافي - الإمام علي (ع)"
},
// 28
{
  en: "The greatest wealth is achieved by having three virtues: contentment with what is given, a firm resolve against what others possess, and the abandonment of greed - Imam Ali (A.S)",
  ar: "من رزق ثلاثاً نال ثلاثاً وهو الغنى الأكبر: القناعة بما أعطي، واليأس مما في أيدي الناس، وترك الفضول - الإمام علي (ع)"
},
// 29
{
  en: "A truly generous man is characterized by three qualities: being liberal with his wealth in both ease and hardship, giving to the deserving, and recognizing that gratitude for his gifts surpasses what he gives - Imam Ali (A.S)",
  ar: "لا يكون الجواد جواداً إلا بثلاثة: أن يكون سخياً بماله على حال اليسر والعسر، وأن يبذله للمستحق، ويرى أن الذي أخذه من شكر الذي أسدى إليه أكثر مما أعطاه - الإمام علي (ع)"
},
// 30
{
  en: "There are three areas in which one should never compromise: choosing a sincere advisor, avoiding a jealous companion, and refraining from excessive ingratiation - Imam Ali (A.S)",
  ar: "ثلاثة لا يعذر المرء فيها: مشاورة ناصح، ومداراة حاسد، والتحبب إلى الناس - الإمام علي (ع)"
},
// 31
{
  en: "A person is not considered wise until he perfectly fulfills these three: giving his due in both contentment and anger, wishing for others what he wishes for himself, and exercising forbearance in hardship - Imam Ali (A.S)",
  ar: "لا يعدّ العاقل عاقلاً حتى يستكمل ثلاثاً: إعطاء الحق من نفسه على حال الرضا والغضب، وأن يرضى للناس ما يرضى لنفسه، واستعمال الحلم عند العثرة - الإمام علي (ع)"
},
// 32
{
  en: "Blessings endure only when three conditions are met: recognizing what God is due in them, expressing gratitude, and exerting oneself to maintain them - Imam Ali (A.S)",
  ar: "لا تدوم النعم إلا بعد ثلاث: معرفة ما يلزم لله فيها، وأداء شكرها، والتعب فيها - الإمام علي (ع)"
},
// 33
{
  en: "If a man is afflicted by even one of these three, he endures consecutive poverty, blatant deprivation, and is overwhelmed by adversaries - Imam Ali (A.S)",
  ar: "ثلاثة من ابتُلي بواحدة منهن: تمنى الموت، فقر متتابع، وحرمة فاضحة، وعدو غالب - الإمام علي (ع)"
},
// 34
{
  en: "He who does not desire these three is doomed to three afflictions: lacking safety leads to betrayal, shunning goodness results in regret, and avoiding close bonds incurs loss - Imam Ali (A.S)",
  ar: "من لم يرغب في ثلاث ابتُلي بثلاث: من لم يرغب في السلامة ابتُلي بالخذلان، ومن لم يرغب في المعروف ابتُلي بالندامة، ومن لم يرغب في الاستكثار من الإخوان ابتُلي بالخسران - الإمام علي (ع)"
},
// 35
{
  en: "Every person must avoid three things: imitating the wicked, engaging in idle chatter with women, and keeping company with innovators in faith - Imam Ali (A.S)",
  ar: "ثلاثة يجب على كل إنسان تجنبها: مقارنة الأشرار، ومحادثة النساء، ومجالسة أهل البدع - الإمام علي (ع)"
},
// 36
{
  en: "Three signs of a generous character are: good manners, the restraint of anger, and averting the eyes - Imam Ali (A.S)",
  ar: "ثلاثة تدل على كرم المرء: حسن الخلق، وكظم الغيظ، وغض الطرف - الإمام علي (ع)"
},
// 37
{
  en: "He who places his trust in three things becomes arrogant: believing in the impossible, relying on the untrustworthy, and coveting what is not his - Imam Ali (A.S)",
  ar: "من وثق بثلاثة كان مغروراً من صدق بما لا يكون، وركن إلى من لا يثق به، وطمع في ما لا يملك - الإمام علي (ع)"
},
// 38
{
  en: "Misusing any of these three will corrupt both your faith and your world: harboring unfounded suspicions, being misled by hearsay, and entrusting leadership to the unworthy - Imam Ali (A.S)",
  ar: "ثلاثة من استعملها أفسد دينه ودنياه: من أساء ظنه، وأمكن من سمعه، وأعطى قيادة حليلته - الإمام علي (ع)"
},
// 39
{
  en: "The best of kings is he who is endowed with three virtues: compassion, generosity, and justice - Imam Ali (A.S)",
  ar: "أفضل الملوك من أعطي ثلاث خصال: الرأفة، والجود، والعدل - الإمام علي (ع)"
},
// 40
{
  en: "A king must never neglect these three duties: guarding his borders, inspecting injustices, and appointing the righteous to his service - Imam Ali (A.S)",
  ar: "ليس يحبّ للملوك أن يفرطوا في ثلاث: حفظ الثغور، وتفقّد المظالم، واختيار الصالحين لأعمالهم - الإمام علي (ع)"
},
// 41
{
  en: "A ruler owes his people three essentials: ensuring their obedience, advising them both privately and publicly, and praying for their victory and righteousness - Imam Ali (A.S)",
  ar: "ثلاث خلال تجب للملوك على أصحابهم: ورعيتهم في الطاعة، والنصيحة لهم في المغيب والمشهد، والدعاء بالنصر والصلاح - الإمام علي (ع)"
},
// 42
{
  en: "A just ruler must do three things for all: reward the benefactor with kindness to inspire further good, cover the sinner’s faults so that he may repent, and unite everyone with fairness and benevolence - Imam Ali (A.S)",
  ar: "ثلاثة تجب على السلطان للخاصة والعامة: مكافأة المحسن بالإحسان؛ لتزداد لديهم الرغبة فيه، وتغمد ذنوب المسيء؛ ليتوب ويرجع عن غيه، وتألفهم جميعاً بالإحسان والإنصاف - الإمام علي (ع)"
},
// 43
{
  en: "Neglecting these three qualities—idleness, little merit, and estrangement from the community—along with encouraging innovations that force conformity, and appointing a leader who prevents proper rule, brings about a ruler’s downfall - Imam Ali (A.S)",
  ar: "ثلاثة أشياء من احتقرها الملوك وأهملها: خمول قليل الفضل، وابتعاد عن الجماعة، ودعوة إلى بدعة تجعل الأمر بالمعروف والنهي عن المنكر، وتعيين رئيس يمنع السلطان من إقامة الحكم - الإمام علي (ع)"
},
// 44
{
  en: "The wise never belittle anyone; the most deserving of respect are those who never scorn scholars, rulers, or brethren—since despising scholars corrupts religion, despising rulers corrupts the world, and despising brethren destroys honor - Imam Ali (A.S)",
  ar: "العاقل لا يستخف بأحد، وأحق من لا يستخف به ثلاثة: العلماء، والسلطان، والإخوان؛ لأنه من استخف بالعلماء أفسد دينه، ومن استخف بالسلطان أفسد دنياه، ومن استخف بالإخوان أفسد مروءته - الإمام علي (ع)"
},
// 45
{
  en: "Beneath a ruler lie three layers: one that aligns with good and blesses all, one that supports his actions—neither praiseworthy nor blameworthy—and one that concurs with evil and is inherently blameworthy - Imam Ali (A.S)",
  ar: "وجدنا بطانة السلطان ثلاث طبقات: طبقة موافقة للخير وهي بركة عليه وعلى السلطان وعلى الرعية، وطبقة تدعم ما بيدها فهي إلى الذم أقرب، وطبقة موافقة للشر وهي مشؤومة - الإمام علي (ع)"
},
// 46
{
  en: "For a people to feel secure, their ruler must provide three essentials: safety, justice, and prosperity - Imam Ali (A.S)",
  ar: "على السلطان ثلاثة أشياء يحتاج إليها الناس: الأمن، والعدل، والخصب - الإمام علي (ع)"
},
// 47
{
  en: "Three things spoil life: an oppressive ruler, a bad neighbor, and an indecent woman - Imam Ali (A.S)",
  ar: "ثلاثة تكدّر العيش: السلطان الجائر، والجار السوء، والمرأة البذيئة - الإمام علي (ع)"
},
// 48
{
  en: "A dwelling is truly pleasant only with three essentials: pure air, abundant fresh water, and fertile land - Imam Ali (A.S)",
  ar: "لا تطيب السكنى إلا بثلاث: الهواء الطيّب، والماء الغزير العذب، والأرض الخوارة - الإمام علي (ع)"
},
// 49
{
  en: "Regret is invariably followed by three traits: boastfulness, arrogance, and self-praise - Imam Ali (A.S)",
  ar: "ثلاثة تعقب الندامة: المباهاة، والمفاخرة، والمعازة - الإمام علي (ع)"
},
// 50
{
  en: "Man is composed of three inherent traits: envy, greed, and lust - Imam Ali (A.S)",
  ar: "ثلاثة مركبة في بني آدم: الحسد، والحرص، والشهوة - الإمام علي (ع)"
},
// 51
{
  en: "Even a trace of these three virtues will enhance one’s majesty, dignity, and beauty; be it piety, generosity, or courage - Imam Ali (A.S)",
  ar: "من كانت فيه خلّة من ثلاثة انتظمت فيه ثلاثتها في تفخيمه وهيبته وجماله؛ من كان له ورع أو سماحة أو شجاعة - الإمام علي (ع)"
},
// 52
{
  en: "Three qualities complete a man: intelligence, beauty, and eloquence - Imam Ali (A.S)",
  ar: "ثلاث خصال من رزقها كان كاملاً: العقل، والجمال، والفصاحة - الإمام علي (ع)"
},
// 53
{
  en: "Safety is granted in three cases: for a woman, until the end of her pregnancy; for a king, until the end of his life; and for the absent, until his return - Imam Ali (A.S)",
  ar: "ثلاثة تقضى لهم بالسلامة: المرأة إلى انقضاء حملها، والملك إلى أن ينفد عمره، والغائب إلى حين إيابه - الإمام علي (ع)"
},
// 54
{
  en: "Deprivation results from three faults: insisting on disputes, engaging in backbiting, and mockery - Imam Ali (A.S)",
  ar: "ثلاثة تورث الحرمان: الإلحاح في المسألة، والغيبة، والهزء - الإمام علي (ع)"
},
// 55
{
  en: "There are three detestable acts: fighting in war at an inopportune time, taking medicine without cause, and seeking a ruler even when one's need is met - Imam Ali (A.S)",
  ar: "ثلاثة تعقب مكروهاً: حملة البطل في الحرب في غير فرصة، وشرب الدواء من غير علة، والتعرّض للسلطان وإن ظفر الطالب بحاجته منه - الإمام علي (ع)"
},
// 56
{
  en: "Every person insists he is right about three matters: his chosen religion, his favored passion, and his own management of affairs - Imam Ali (A.S)",
  ar: "ثلاث خلال يقول كل إنسان أنه على صواب منها: دينه الذي يعتقده، وهواه الذي يستعلي عليه، وتدبيره في أموره - الإمام علي (ع)"
},
// 57
{
  en: "People fall into three classes: those who are noble and obedient, those who are capable and equal, and those who are hostile - Imam Ali (A.S)",
  ar: "الناس كلهم ثلاث طبقات: سادة مطاعون، وأكفاء متكافون، وأناس متعادون - الإمام علي (ع)"
},
// 58
{
  en: "The world is sustained by three essentials: fire, salt, and water - Imam Ali (A.S)",
  ar: "قوام الدنيا بثلاثة أشياء: النار، والملح، والماء - الإمام علي (ع)"
},
// 59
{
  en: "He who seeks any of these three without right is deprived in return: seeking worldly life unjustly forfeits the hereafter; seeking leadership without merit forfeits obedience; and seeking wealth without right forfeits its permanence - Imam Ali (A.S)",
  ar: "من طلب ثلاثة بغير حق حرم ثلاثة بحق: من طلب الدنيا بغير حق حرم الآخرة بحق، ومن طلب الرئاسة بغير حق حرم الطاعة له بحق، ومن طلب المال بغير حق حرم بقاءه له بحق - الإمام علي (ع)"
},
// 60
{
  en: "A resolute person should never engage in these three: testing poison to see if one survives, divulging secrets to envious relatives, or venturing out to sea despite wealth - Imam Ali (A.S)",
  ar: "ثلاثة لا ينبغي للمرء الحازم أن يتقدم عليها: شرب السم للتجربة وإن نجا منه، وإفشاء السر إلى القرابة الحاسد وإن نجا منه، وركوب البحر وإن كان الغنى فيه - الإمام علي (ع)"
},
// 61
{
  en: "Every community must have three essentials—a jurist, a discerning leader, and a trusted physician—lest they descend into barbarism - Imam Ali (A.S)",
  ar: "لا يستغني أهل كل بلد عن ثلاثة: فقيه، وأمير خير مطاع، وطبيب بصير ثقة - الإمام علي (ع)"
},
// 62
{
  en: "A true friend is proven by three qualities: if he excels in them, he is a sincere friend; if not, he is only a friend in prosperity, not in adversity - Imam Ali (A.S)",
  ar: "يمتحن الصديق بثلاث خصال: فإن كان مؤاتياً فيها فهو الصديق المصافي، وإلا كان صديق رخاء لا صديق شدة - الإمام علي (ع)"
},
// 63
{
  en: "If people are spared three evils—the evil tongue, the harmful hand, and wrongful deeds—they are truly safe - Imam Ali (A.S)",
  ar: "إن يسلم الناس من ثلاثة أشياء كانت سلامة شاملة: لسان السوء، ويد السوء، وفعل السوء - الإمام علي (ع)"
},
// 64
{
  en: "A servant who lacks any one of these three qualities cannot benefit from faith: forbearance to counter ignorance, piety to refrain from forbidden acts, and character that restrains others - Imam Ali (A.S)",
  ar: "إذا لم تكن في المملوك خصلة من ثلاث لم ينفعه الإيمان: حلم يرد به جهل الجاهل، وورع يحجزه عن طلب المحارم، وخلق يداري به الناس - الإمام علي (ع)"
},
// 65
{
  en: "A man needs three things in his home and family—even if it is not in his nature—to ensure pleasant companionship, generous understanding, and protective concern - Imam Ali (A.S)",
  ar: "إن المرء يحتاج في منزله وعياله إلى ثلاث خلال: يتكلفها، وإن لم يكن في طبعه ذلك معاشرة جميلة، وسعة بتقدير، وغيرة بتحصن - الإمام علي (ع)"
},
// 66
{
  en: "Every craftsman must possess three qualities to earn his livelihood: skillfulness in his work, faithful execution of his duties, and persistence with those who employ him - Imam Ali (A.S)",
  ar: "كل ذي صناعة مضطر إلى ثلاث خلال: يجتلب بها المكسب، وهو أن يكون حاذقاً بعمله، مؤدياً للأمانة فيه، ومستميلاً لمن استعمله - الإمام علي (ع)"
},
// 67
{
  en: "Of those afflicted by one misfortune, three outcomes may befall: a mind lost to folly, a corrupt spouse, or calamity with a loved one - Imam Ali (A.S)",
  ar: "ثلاث من ابتُلي بواحدة منهن: كان طائح العقل، وزوجة فاسدة، وفجيعة بحبيب - الإمام علي (ع)"
},
// 68
{
  en: "Courage is built upon three temperaments—self-generosity, pride in avoiding humiliation, and the pursuit of honor; when these unite, a hero emerges whose boldness stands unrivaled - Imam Ali (A.S)",
  ar: "جبلت الشجاعة على ثلاث طبائع: لكل واحدة منهن فضيلة تختلف عن الأخرى: السخاء بالنفس، والأنفة من الذل، وطلب الذكر؛ فإن تكاملت في الشجاع كان البطل الذي لا يُقام لسبيله والموسوم بالإقدام في عصره، وإن تفاضلت فيها بعضها على بعض كانت شجاعته أكثر وأشد - الإمام علي (ع)"
},
// 69
{
  en: "A child owes his parents three things: gratitude in all circumstances, obedience in what they command (as long as it does not disobey God), and heed to their counsel both in private and public - Imam Ali (A.S)",
  ar: "يجب للوالدين على الولد ثلاثة أشياء: شكرهما على كل حال، وطاعتهما فيما يأمران به وينهيانه عنه في غير معصية الله، ونصيحتهما في السر والعلانية - الإمام علي (ع)"
},
// 70
{
  en: "A son owes his father three obligations: choosing his mother, enhancing his reputation, and showing utmost diligence in his discipline - Imam Ali (A.S)",
  ar: "تجب للولد على والده ثلاث خصال: اختياره لوالدته، وتحسين اسمه، والمبالغة في تأديبه - الإمام علي (ع)"
},
// 71
{
  en: "Among siblings, three virtues are essential to prevent estrangement: fairness, compassion, and the avoidance of envy - Imam Ali (A.S)",
  ar: "تحتاج الإخوة فيما بينهم إلى ثلاثة أشياء: التناصف، والتراحم، ونفي الحسد - الإمام علي (ع)"
},
// 72
{
  en: "If kinship does not converge on these three essentials—abandoning envy, maintaining close communication, and cooperating to foster honor—the family is doomed to weakness and enemy mockery - Imam Ali (A.S)",
  ar: "إذا لم تجتمع القرابة على ثلاثة أشياء: ترك الحسد فيما بينهم، والتواصل لتعزيز الألفة، والتعاون لتشملهم العزة؛ تعرضوا لدخول الوهن وشماتة الأعداء - الإمام علي (ع)"
},
// 73
{
  en: "A husband is incomplete without three qualities in his relationship with his wife: harmony to secure her love, exemplary conduct to win her heart, and the ability to console her during missteps; likewise, a wife must uphold modesty, vigilance, and affectionate expression to reassure her husband - Imam Ali (A.S)",
  ar: "لا غنى بالزوج عن ثلاثة أشياء فيما بينه وبين زوجته: الموافقة التي تجتذب حبها واستحسانها، وحسن خلقه الذي يستمال به قلبها، واستعداده لحمايتها عند زلاتها؛ ولا غنى بالزوجة عن ثلاث خصال تجاه زوجها: صيانة نفسها من كل دنس، وحياطته التي تطمئن قلبه، وإظهار العشق له - الإمام علي (ع)"
},
// 74
{
  en: "A good deed is perfected by three factors: hastening its execution, limiting its excess, and renouncing any ingratitude toward it - Imam Ali (A.S)",
  ar: "لا يتم المعروف إلا بثلاث: تعجيله، وتقليل كثيره، وترك الامتنان به - الإمام علي (ع)"
},
// 75
{
  en: "True joy is derived from three sources: loyalty, the safeguarding of rights, and the support of those in distress - Imam Ali (A.S)",
  ar: "السرور في ثلاث: الوفاء، ورعاية الحقوق، والنهوض في النوائب - الإمام علي (ع)"
},
// 76
{
  en: "Sound judgment is evidenced by three traits: a warm reception, attentive listening, and an appropriate response - Imam Ali (A.S)",
  ar: "ثلاثة يستدل بها على إصابة الرأي: حسن اللقاء، وحسن الاستماع، وحسن الجواب - الإمام علي (ع)"
},
// 77
{
  en: "Men are of three types: the wise, who respond aptly; the foolish, who speak hastily and err; and the degenerate, who betray trust and offend when spoken to - Imam Ali (A.S)",
  ar: "الرجال ثلاثة: عاقل وأحمق وفاجر؛ فالعاقل إن كلم أجاب، وإن نطق أصاب، وإن سمع وعى؛ والأحمق إن تكلم عجل، وإن حدث ذهل، وإن حمل على القبيح فعل؛ والفاجر إن ائتمنته خانك، وإن حدثته شانك - الإمام علي (ع)"
},
// 78
{
  en: "Brothers come in three forms: one who nourishes like food, indispensable at all times (the wise); one who is like a disease (the foolish); and one who is like medicine (the prudent) - Imam Ali (A.S)",
  ar: "الإخوان ثلاثة: فواحد كالغذاء الذي يحتاج إليه كل وقت فهو العاقل، والثاني في معنى الداء وهو الأحمق، والثالث في معنى الدواء فهو اللبيب - الإمام علي (ع)"
},
// 79
{
  en: "Three indicators of an active mind are: a messenger suited to his mission, a gift commensurate with its guidance, and a book reflecting its writer - Imam Ali (A.S)",
  ar: "ثلاثة أشياء تدل على عقل فاعلها: الرسول على قدر من أرسله، والهدية على قدر مهديها، والكتاب على قدر كاتبه - الإمام علي (ع)"
},
// 80
{
  en: "Knowledge is comprised of three elements: a clear sign, a just obligation, and an enduring tradition - Imam Ali (A.S)",
  ar: "العلم ثلاثة: آية محكمة، وفريضة عادلة، وسنة قائمة - الإمام علي (ع)"
},
// 81
{
  en: "People fall into three categories: the ignorant who refuse to learn, the scholar whose knowledge is evident, and the wise who strive for both this world and the hereafter - Imam Ali (A.S)",
  ar: "الناس ثلاثة: جاهل يأبى أن يتعلم، وعالم قد شفه علمه، وعاقل يعمل لدنياه وآخرته - الإمام علي (ع)"
},
// 82
{
  en: "There are three qualities which, when absent, cause no estrangement: refined manners, restraint from harm, and avoidance of suspicion - Imam Ali (A.S)",
  ar: "ثلاثة ليس معهن غربة: حسن الأدب، وكف الأذى، ومجانبة الريب - الإمام علي (ع)"
},
// 83
{
  en: "Days fall into three types: a past day that can never be recaptured, a present day to be seized by people, and a tomorrow that exists only as hope - Imam Ali (A.S)",
  ar: "الأيام ثلاثة: يوم مضى لا يدرك، ويوم الناس فيه فينبغي أن يغتنموه، وغد إنما في أيديهم أمله - الإمام علي (ع)"
},
// 84
{
  en: "Without these three virtues—enduring patience to counter ignorance, piety to ward off forbidden desires, and noble character to restrain others—faith cannot benefit a man - Imam Ali (A.S)",
  ar: "من لم تكن فيه ثلاث خصال لم ينفعه الإيمان: حلم يرد به جهل الجاهل، وورع يحجزه عن طلب المحارم، وخلق يداري به الناس - الإمام علي (ع)"
},
// 85
{
  en: "Perfect faith is evident in three ways: when anger does not divert one from truth, when contentment does not lead to falsehood, and when honor is met with forgiveness - Imam Ali (A.S)",
  ar: "ثلاث من كن فيه استكمل الإيمان: من إذا غضب لم يخرجه غضبه من الحق، وإذا رضي لم يخرجه رضاه إلى الباطل، ومن إذا قدر عف - الإمام علي (ع)"
},
// 86
{
  en: "The possessor of worldly affairs requires three qualities: promptness without hesitation, generosity paired with contentment, and courage free from laziness - Imam Ali (A.S)",
  ar: "ثلاث خصال يحتاج إليها صاحب الدنيا: الدعة من غير توان، والسعة مع قناعة، والشجاعة من غير كسل - الإمام علي (ع)"
},
// 87
{
  en: "A wise man should never forget three truths: the transience of this world, the shifting nature of circumstances, and the inevitable afflictions that offer no security - Imam Ali (A.S)",
  ar: "ثلاثة أشياء لا ينبغي للعاقل أن ينساهن: فناء الدنيا، وتصرف الأحوال، والآفات التي لا أمان له - الإمام علي (ع)"
},
// 88
{
  en: "No one ever possesses in full the trio of faith, intellect, and diligence - Imam Ali (A.S)",
  ar: "ثلاثة أشياء لا ترى كاملة في واحد: قط الإيمان والعقل والاجتهاد - الإمام علي (ع)"
},
// 89
{
  en: "The value of a person is measured by what he excels at - Imam Ali (A.S)",
  ar: "قِيمَةُ كُلِّ امرئٍ مَا يُحْسِنُهُ - الإمام علي (ع)"
},
// 90
{
  en: "I marvel at those who despair while still clinging to forgiveness - Imam Ali (A.S)",
  ar: "عَجِبْتُ لِمَنْ يَقْنَطُ وَمَعَهُ الاسْتِغْفَارُ - الإمام علي (ع)"
},
// 91
{
  en: "The world is like a snake: soft to the touch yet harboring lethal venom; the ignorant are drawn to it while the wise keep their distance - Imam Ali (A.S)",
  ar: "الدُّنْيَا كَمَثَلِ الْحَيَّةِ: لَيِّنٌ مَسُّهَا، وَالسُّمُّ النَّاقِعُ فِي جَوْفِهَا، يَهْوِي إِلَيْهَا الْغِرُّ الْجَاهِلُ، وَيَحْذَرُهَا ذُو اللُّبِّ الْعَاقِلُ - الإمام علي (ع)"
},
// 92
{
  en: "If you are capable of overcoming your enemy, show him forgiveness as a sign of your superiority - Imam Ali (A.S)",
  ar: "إِذَا قَدَرْتَ عَلَى عَدُوِّكَ فَاجْعَلِ الْعَفْوَ عَنْهُ شُكْراً لِلْقُدْرَةِ عَلَيْهِ - الإمام علي (ع)"
},
// 93
{
  en: "If the world bestows upon someone the virtues of others, and if it withdraws them, depriving him of his own, then take heed - Imam Ali (A.S)",
  ar: "إِذَا أَقْبَلَتِ الدُّنْيَا عَلَى أَحَدٍ أَعَارَتْهُ مَحَاسِنَ غَيْرِهِ، وَإِذَا أَدْبَرَتْ عَنْهُ سَلَبَتْهُ مَحَاسِنَ نَفْسِهِ - الإمام علي (ع)"
},
// 94
{
  en: "When the blessings of the world reach you, do not repel them with ingratitude - Imam Ali (A.S)",
  ar: "إِذَا وَصَلَتْ إِلَيْكُمْ أَطْرَافُ النِّعَمِ فَلَا تُنْفِرُوا أَقْصَاهَا بِقِلَّةِ الشُّكْرِ - الإمام علي (ع)"
},
// 95
{
  en: "O son of Adam! When you behold your Lord showering blessings upon you while you disobey Him, be warned - Imam Ali (A.S)",
  ar: "يَا بُنَي آدَمَ، إِذَا رَأَيْتَ رَبَّكَ سُبْحَانَهُ يُتَابِعُ عَلَيْكَ نِعَمَهُ وَأَنْتَ تَعْصِيهِ فَاحْذَرْه - الإمام علي (ع)"
},
// 96
{
  en: "Whatever one harbors in his heart eventually shows itself in slips of the tongue and expressions on the face - Imam Ali (A.S)",
  ar: "مَا أَضْمَرَ أَحَدٌ شَيْئًا إِلاَّ ظَهَرَ فِي فَلَتَاتِ لِسَانِهِ، وَصَفَحَاتِ وَجْهِهِ - الإمام علي (ع)"
},
// 97
{
  en: "The doer of good is better than him, and the doer of evil is worse than him - Imam Ali (A.S)",
  ar: "فَاعِلُ الْخَيْرِ خَيْرٌ مِنْهُ، وَفَاعِلُ الشَّرِّ شَرٌّ مِنْهُ - الإمام علي (ع)"
},
// 98
{
  en: "The tongue of the wise follows his heart, while the fool's heart trails behind his tongue - Imam Ali (A.S)",
  ar: "لِسَانُ الْعَاقِلِ وَرَاءَ قَلْبِهِ، وَقَلْبُ الأحمقِ وَرَاءَ لِسَانِهِ - الإمام علي (ع)"
},
// 99
{
  en: "Wealth in a foreign land is like having a home, while poverty in one's own country makes one a stranger - Imam Ali (A.S)",
  ar: "الْغِنَى فِي الْغُرْبَةِ وَطَنٌ، وَالْفَقْرُ فِي الْوَطَنِ غُرْبَةٌ - الإمام علي (ع)"
},
// 107
{
  en: "The believer is like the scales of a balance: the more his faith increases, the heavier his trials become - Imam Ali (A.S)",
  ar: "إن المؤمن مثل كفتي الميزان: كلما زاد في إيمانه زاد في بلائه - الإمام علي (ع)"
},
// 114
{
  en: "May this reminder of our transient world and the consequences of our actions guide us to act righteously - Imam Ali (A.S)",
  ar: "إِنَّ لله فِي كُلِّ نِعْمَةٍ حَقًّا، فَمَنْ أَدَّاهُ زَادَهُ مِنْهَا، وَمَنْ قَصَّرَ مِنْهُ خَاطَرَ بِزَوَالِ نِعْمَتِهِ - الإمام علي (ع)"
},
{
  en: "Knowledge is the seed of understanding, and lengthy experiences add to reason. Honor is piety, contentment is the comfort of bodies. Whoever loves you restrains you, and whoever hates you tempts you. - Imam Hussein (A.S)",
  ar: "الْعِلْمُ لِقاحُ الْمَعْرِفَةِ ، وَطُولُ التَّجارُبِ زِيادَةٌ فِي الْعَقْلِ ، وَالشَّرَفُ التَّقْوى ، وَالْقُنُوعُ راحَةُ الأْبْدانِ ، وَمَنْ أَحَبَّكَ نَهاكَ ، وَمَنْ أَبْغَضَكَ أَغْراكَ - الإمام الحسين (ع)"
},
{
  en: "The truth of intention is the will emanating from power arising from knowledge. - Imam Hussein (A.S)",
  ar: "حقيقةُ النية ، هي الإرادةُ الباعثةُ للقدرة المنبعثة عن المعرفة - الإمام الحسين (ع)"
},
{
  en: "Among the signs of a scholar is his criticism of his own speech, and his knowledge of the realities of different perspectives. - Imam Hussein (A.S)",
  ar: "مِن دلائلِ العالم انتقاده لحديثه ، وعلمه بحقائق فنون النظر - الإمام الحسين (ع)"
},
{
  en: "If you hear someone backbiting people, strive not to be known by him. - Imam Hussein (A.S)",
  ar: "إِذا سَمعتَ أحداً يَتَناولُ أعراضَ الناسِ فاجتَهِد أنْ لا يَعرِفك - الإمام الحسين (ع)"
},
{
  en: "God created knowledge as the seed of understanding, and lengthy experiences add to reason. Honor is piety, and contentment is the comfort of bodies. Whoever loves you restrains you, and whoever hates you tempts you. - Imam Hussein (A.S)",
  ar: "ذَرَأَ اللَّهُ الْعِلْمَ‏ لِقَاحَ الْمَعْرِفَةِ، وَ طُولَ التَّجَارِبِ زِيَادَةً فِي الْعَقْلِ، وَ الشَّرَفَ التَّقْوَى‏، وَ الْقُنُوعَ رَاحَةَ الْأَبْدَانِ، مَنْ أَحَبَّكَ نَهَاكَ، وَ مَنْ أَبْغَضَكَ أَغْرَاكَ - الإمام الحسين (ع)"
},
{
  en: "Among the signs of acceptance is sitting with people of intellect, and among the signs of ignorance is arguing with those who are not disbelievers, and among the signs of a scholar is his criticism of his own speech and his knowledge of the realities of different perspectives. - Imam Hussein (A.S)",
  ar: "مِن دَلائِل عَلامات القَبول الجُلوس إلى أهلِ العقول، ومِن علامات أسبابِ الجَهل المُمَارَاة لِغَير أهلِ الكفر، وَمِن دَلائل العَالِم انتقَادُه لِحَديثِه، وَعِلمه بِحقَائق فُنون النظَر - الإمام الحسين (ع)"
},
{
  en: "In the Quran is the knowledge of everything, and the knowledge of the Quran is in the letters at the beginning of the surahs, and the knowledge of the letters is in the letter 'lam alif'. - Imam Hussein (A.S)",
  ar: "في القرآن علمُ كل شيء ، وعلمُ القرآن في الأحرف التي في أوائل السور، وعلمُ الحروف في لام الألف - الإمام الحسين (ع)"
},
{
  en: "Whoever takes care of an orphan who is cut off from us by our love in our concealment, consoling him with our knowledge that has fallen to him until he guides him, Allah Almighty says: 'O noble, sympathizing servant, I am more worthy of generosity than you. O my angels, make for him in Paradise a thousand palaces for every letter he has taught.' - Imam Hussein (A.S)",
  ar: "مَن كَفل لنا يتيماً قطعته عنّا محبّتنا باستتارنا، فواساه من علومنا التي سقطت إليه حتّى أرشده وهداه، قال الله عزّ وجلّ: أيُّها العبد الكريم المواسي أنا أولى بالكرم منك، اجعلوا له يا ملائكتي في الجنان بعدد كلّ حرف علّمه ألف ألف قصر - الإمام الحسين (ع)"
},
{
  en: "Death is better than embarking on shame, and shame is better than entering Hellfire, and Allah protects from both. - Imam Hussein (A.S)",
  ar: "الموتُ خيرٌ مِن ركوبِ العارِ والعاُر خيرٌ مِن دخولِ النّارِ والله مِن هذا وهذا جار - الإمام الحسين (ع)"
},
{
  en: "Do not say about your believing brother when he is out of your sight except what you would like him to say about you when you are out of his sight. - Imam Hussein (A.S)",
  ar: "لا تقولنَّ في أخيك المؤمن إذا توارى عنك إلا ما تحب أن يقول فيك إذا تواريت عنه - الإمام الحسين (ع)"
},
{
  en: "Indeed, whoever bases his religion on analogy will remain in confusion throughout time, straying from the right path, and deviating into crookedness. - Imam Hussein (A.S)",
  ar: "إنَّ مَنْ وَضع دينهُ على القياس لمْ يَزل الدّهر في الإرتماس ، مائلاً عن المنهاج ، ظاعناً في الإعوجاج - الإمام الحسين (ع)"
},
{
  en: "I am amazed at one who thinks about what he eats, how does he not think about what he comprehends? He keeps his stomach from what harms it, yet deposits in his chest what ruins it. - Imam Hassan (A.S)",
  ar: "عجبت لمن يفكر في مأكوله، كيف لا يفكر في معقوله، فيجنّب بطنه ما يؤذيه، ويودع صدره ما يرديه؟ - الإمام الحسن (ع)"
},
{
  en: "If the calamity has given you a lesson, and earned you a reward, then it is so; otherwise, your calamity in yourself is greater than your calamity in your dead. - Imam Hassan (A.S)",
  ar: "إن كانت المصيبة أحدثت لك موعظةً، وكسّبتك أجراً فهو، وإلا فمصيبتك في نفسك أعظم من مصيبتك في ميتك - الإمام الحسن (ع)"
},
{
  en: "A man asked Hassan: 'Who is the worst of people?' He said: 'Whoever thinks he is the best of them.' - Imam Hassan (A.S)",
  ar: "قال رجل للحسن: من شرّ الناس؟ فقال: (من يرى أنّه خيرهم) - الإمام الحسن (ع)"
},
{
  en: "Consider what you sought from the world but did not attain as if it had never crossed your mind. - Imam Hassan (A.S)",
  ar: "اجعل ما طلبت من الدنيا فلم تظفر به بمنزلة ما لم يخطر ببالك - الإمام الحسن (ع)"
},
{
  en: "If your soul does not obey you in what you burden it with of what it dislikes, then do not obey it in what it burdens you with of what it desires. - Imam Hassan (A.S)",
  ar: "إن لم تطعك نفسك فيما تحملها عليه ممّا تكره، فلا تطعها فيما تحملك عليه ممّا تهوى - الإمام الحسن (ع)"
},
{
  en: "The generous is most forgiving when the sinner has no excuse. - Imam Hassan (A.S)",
  ar: "أوسع ما يكون الكريم بالمغفرة، إذا ضاقت بالمذنب المعذرة - الإمام الحسن (ع)"
},
{
  en: "I advise you to fear Allah and to continue to reflect, for reflection is the father and mother of all good. - Imam Hassan (A.S)",
  ar: "أوصيكم بتقوى الله، وإدامة التفكّر، فإنّ التفكّر أبو كلّ خيرٍ وأمّه - الإمام الحسن (ع)"
},
{
  en: "Between you and admonition is the veil of pride. - Imam Hassan (A.S)",
  ar: "بينكم وبين الموعظة حجاب العزّة - الإمام الحسن (ع)"
},
{
  en: "Abandoning adultery, cleaning the courtyard, and washing utensils bring about wealth. - Imam Hassan (A.S)",
  ar: "ترك الزّنا، وكنس الفناء، وغسل الإناء، مجلبة للغناء - الإمام الحسن (ع)"
},
{
  en: "Fulfilling the need of a brother in faith is more beloved to me than a month of retreat. - Imam Hassan (A.S)",
  ar: "لقضاء حاجة أخٍ لي في الله أحبّ إليّ من اعتكاف شهر - الإمام الحسن (ع)"
},
{
  en: "I do not know anyone except he is foolish in what is between him and his Lord. - Imam Hassan (A.S)",
  ar: "ما أعرف أحداً إلا وهو أحمق فيما بينه وبين ربّه - الإمام الحسن (ع)"
},
{
  en: "Whoever knows Allah loves Him, and whoever knows the world abstains from it. And the believer does not play until he becomes heedless, and when he reflects, he becomes sad. - Imam Hassan (A.S)",
  ar: "من عرف الله أحبّه، ومن عرف الدنيا زهد فيها. والمؤمن لا يلهو حتّى يغفل، وإذا تفكّر حزن - الإمام الحسن (ع)"
},
{
  en: "Whoever competes with you in your religion, then compete with him; and whoever competes with you in your world, then throw it in his neck. I was asked: 'How are you, O son of the Messenger of Allah?' He said: 'I woke up with a Lord above me, and Hell in front of me, and death seeking me, and accountability surrounding me, and I am bound by my deeds. I do not find what I love, nor can I repel what I hate, and affairs are in the hand of other than me. If He wills, He punishes me, and if He wills, He forgives me. So which poor person is more impoverished than me?' - Imam Hassan (A.S)",
  ar: "من نافسك في دينك فنافسه، ومن نافسك في دنياك فألقها في نحره.- قيل له: كيف أصبحت يابن رسول الله؟ فقال: أصبحت ولي ربّ فوقي، والنار أمامي، والموت يطلبني، والحساب محدق بي، وأنا مرتهن بعملي لا اجد ما أحبّ، ولا أدفع ما اكره، والأمور بيد غيري فإن شاء عذّبني، وإن شاء عفى عنّي، فأيّ فقيرٍ أفقر منّي - الإمام الحسن (ع)"
},
{
  en: "People will enter Hellfire and the people of Hell will say to them: 'What is wrong with you that you are afflicted until we pity you despite what we are in?' They say: 'O people, Allah placed knowledge in our hearts but we did not benefit from it ourselves, nor did we benefit others with it.' - Imam Hassan (A.S)",
  ar: "يدخل النّار قوم فيقول لهم أهلها:ما بالكم ابتليتم حتّى صرنا نرحمكم مع ما نحن فيه؟ فقالوا: ياقوم، جعل الله في أجوافنا علماً فلم ننتفع به نحن، ولا نفعنا به غيرنا - الإمام الحسن (ع)"
},
{
  en: "May Allah have mercy on people for whom the world was a trust, so they returned it to those who entrusted them with it, then they went lightly. - Imam Hassan (A.S)",
  ar: "رحم الله أقواماً كانت الدّنيا عندهم وديعةً، فأدّوها إلى من ائتمنهم عليها، ثمّ راحوا خفافاً - الإمام الحسن (ع)"
},
{
  en: "The son of Adam does not leave this world except with three regrets: that he did not get enough of what he gathered, did not attain what he hoped for, and did not prepare well for what he is going to. - Imam Hassan (A.S)",
  ar: "لا تخرج نفس ابن آدم من الدّنيا إلا بحسراتٍ ثلاثٍ: أنّه لم يشبع بما جمع، ولم يدرك ما أمّل، ولم يحسن الزّاد لما قدم عليه - الإمام الحسن (ع)"
},
{
  en: "Indeed, the sheep is more rational than most people; it is deterred from its desires by the shepherd's shout, while humans are not deterred by Allah's commands, His books, and His messengers. - Imam Hassan (A.S)",
  ar: "إنّ الشّاة أعقل من أكثر النّاس، تنزجر بصياح الرّاعي عن هواها، والانسان لا ينزجر بأوامر الله وكتبه ورسله - الإمام الحسن (ع)"
},
{
  en: "O youth: You must seek the hereafter, for by Allah, we have seen people who sought the hereafter and attained both the world and the hereafter, and by Allah, we have never seen anyone who sought the world and attained the hereafter. - Imam Hassan (A.S)",
  ar: "معاشر الشّباب: عليكم بطلب الآخرة، فوالله رأينا أقواماً طلبوا الآخرة فأصابوا الدّنيا والآخرة، ووالله ما رأينا من طلب الدّنيا فأصاب الآخرة - الإمام الحسن (ع)"
},
{
  en: "People are of two kinds: one who seeks the world until when he attains it, he perishes, and one who seeks the hereafter until when he attains it, he is saved and successful. - Imam Hassan (A.S)",
  ar: "النّاس طالبان: طالب يطلب الدّنيا حتّى اذا أدركها هلك، وطالب يطلب الآخرة حتّى إذا أدركها فهو ناجٍ فائز - الإمام الحسن (ع)"
},
{
  en: "Everyone who is hasty asks for respite, and everyone who is granted a delay makes excuses by procrastination. - Imam Hassan (A.S)",
  ar: "كلّ معاجلٍ يسأل النّظرة، وكلّ مؤجّلٍ يتعلّل بالتسويف - الإمام الحسن (ع)"
},
{
  en: "O son of Adam! Who is like you? Your Lord has cleared the way between Him and you. Whenever you wish to enter into His presence, you perform ablution and stand before Him, complaining to Him about your worries and needs, seeking His help in your affairs, without any veil or doorkeeper between you and Him. - Imam Hassan (A.S)",
  ar: "يا ابن آدم! من مثلك؟ وقد خلا ربّك بينه وبينك متى شئت أن تدخل إليه، توضّأت وقمت بين يديه، ولم يجعل بينك وبينه حجاباً ولا بوّاباً، تشكو إليه همومك وفاقتك، وتطلب منه حوائجك، وتستعينه على أمورك - الإمام الحسن (ع)"
},
{
  en: "Whoever honors his own self, the world becomes insignificant to him. - Imam Zain al-Abidin (A.S)",
  ar: "من كرمت عليه نفسه هانت عليه الدنيا. - الإمام زين العابدين (ع)"
},
{
  en: "He who does not perceive the world as a danger to his soul. - Imam Zain al-Abidin (A.S)",
  ar: "من لم ير الدنيا خطرا لنفسه. - الإمام زين العابدين (ع)"
},
{
  en: "Whoever is content with what God has apportioned for him is among the richest of people. - Imam Zain al-Abidin (A.S)",
  ar: "من قنع بما قسم الله له فهو من أغنى الناس. - الإمام زين العابدين (ع)"
},
{
  en: "Beware of both the small and the great lies, for if a man lies in trivial matters, he will dare to lie in serious ones. - Imam Zain al-Abidin (A.S)",
  ar: "اتقوا الكذب الصغير منه والكبير في كل جد وهزل، فإن الرجل إذا كذب في الصغير اجترأ على الكبير. - الإمام زين العابدين (ع)"
},
{
  en: "Sufficient is God’s support when you see your enemy committing sins through you. - Imam Zain al-Abidin (A.S)",
  ar: "كفى بنصر الله لك أن ترى عدوك يعمل بمعاصي الله فيك. - الإمام زين العابدين (ع)"
},
{
  en: "All goodness lies in the preservation of one’s self. - Imam Zain al-Abidin (A.S)",
  ar: "الخير كله صيانة الإنسان نفسه. - الإمام زين العابدين (ع)"
},
{
  en: "True knowledge and the perfection of a Muslim’s faith are shown by refraining from speaking of matters that do not concern him, avoiding hypocrisy, being patient, and exhibiting good character. - Imam Zain al-Abidin (A.S)",
  ar: "إن المعرفة وكمال دين المسلم تركه الكلام فيما لا يعنيه، وقلة مرائه، وحلمه، وصبره، وحسن خلقه. - الإمام زين العابدين (ع)"
},
{
  en: "I do not petition my Lord; rather, 'God is sufficient for me, and He is the best disposer of affairs.' - Imam Zain al-Abidin (A.S)",
  ar: "لا أقترح على ربي، بل حسبي الله ونعم الوكيل. - الإمام زين العابدين (ع)"
},
{
  en: "I was never presented with two alternatives—one for this world and one for the Hereafter—so I chose the world until I witnessed something detestable before nightfall. - Imam Zain al-Abidin (A.S)",
  ar: "ما عرض لي قط أمران: أحدهما للدنيا والآخر للآخرة، فآثرت الدنيا إلا رأيت ما أكره قبل أن أمسي. - الإمام زين العابدين (ع)"
},
{
  en: "Be patient in adversity, do not infringe on rights, and do not impose on your brother a matter that harms you more than it benefits him. - Imam Zain al-Abidin (A.S)",
  ar: "يا بني، اصبر على النوائب، ولا تتعرّض للحقوق، ولا تجب أخاك إلى الأمر الذي يضرك أكثر من نفعه. - الإمام زين العابدين (ع)"
},
{
  en: "I do not wish my soul to be squandered on the extravagance of blessings, nor do I value a drop of favor more than a drop of anger that I would not reciprocate. - Imam Zain al-Abidin (A.S)",
  ar: "ما أحبُّ أن يبذلَّ نفسي حُمر النعم، وما تجرّعت من جرعة أحب إليَّ من جرعة غيظٍ لا أكافئ بها صاحبها. - الإمام زين العابدين (ع)"
},
{
  en: "Woe to him whose one is overpowered by his ten—he considers a bad deed as one and a good deed as ten. - Imam Zain al-Abidin (A.S)",
  ar: "يا سوأتاه لمنغلبت إحداته عشراته – يريد أن السيئة بواحدة والحسنة بعشرة. - الإمام زين العابدين (ع)"
},
{
  en: "Among the qualities of a believer is to spend according to his means, to be generous within his capacity, to be just toward others from his own self, and to begin interactions with a greeting of peace. - Imam Zain al-Abidin (A.S)",
  ar: "إن من أخلاق المؤمن الإنفاق على قدر الإقتار، والتوسع على قدر التوسع، وإنصاف الناس من نفسه، وابتداؤهم بالسلام. - الإمام زين العابدين (ع)"
},
{
  en: "Three means of salvation for the believer are: restraining his tongue from gossip, engaging himself in what benefits his Hereafter and worldly life, and weeping extensively over his sins. - Imam Zain al-Abidin (A.S)",
  ar: "ثلاث منجيات للمؤمن: كف لسانه عن الناس واغتيابهم، وإشغال نفسه بما ينفعه في آخرته ودنياه، وطول البكاء على خطيئته. - الإمام زين العابدين (ع)"
},
{
  en: "The act of a believer looking upon his fellow with affection is an act of worship. - Imam Zain al-Abidin (A.S)",
  ar: "نظر المؤمن في وجه أخيه المؤمن للمودة والمحبة له عبادة. - الإمام زين العابدين (ع)"
},
{
  en: "Do good to everyone who asks of you; if he is deserving, you have fulfilled his need, and if not, you are his equal; and if someone insults you then later apologizes, accept his apology. - Imam Zain al-Abidin (A.S)",
  ar: "افعل الخير إلى كل من طلبه منك؛ فإن كان أهله فقد أصبت موضعه، وإن لم يكن فأنت أهله؛ وإن شتمك رجل عن يمينك ثم تحول إلى يسارك واعتذر إليك فاقبل عذره. - الإمام زين العابدين (ع)"
},
{
  en: "The gatherings of the righteous call to righteousness; the etiquette of scholars enhances intellect; obedience to rulers epitomizes honor; proper management of wealth reflects nobility; advising wisely fulfills the right of blessings; and refraining from harm signifies perfect intellect and brings bodily comfort in this world and the next. - Imam Zain al-Abidin (A.S)",
  ar: "مجالس الصالحين داعية إلى الصلاح، وآداب العلماء زيادة في العقل، وطاعة ولاة الأمر تمام العز، واستنماء المال تمام المروءة، وإرشاد المستشير قضاء لحق النعمة، وكف الأذى من كمال العقل وفيه راحة للبدن عاجلاً وآجلاً. - الإمام زين العابدين (ع)"
},
{
  en: "Glory be to Him who made acknowledging blessings an act of praise; glory be to Him who made being unable to express thanks an act of gratitude. - Imam Zain al-Abidin (A.S)",
  ar: "سبحان من جعل الاعتراف بالنعمة له حمداً، وسبحان من جعل الاعتراف بالعجز عن الشكر شكراً. - الإمام زين العابدين (ع)"
},
{
  en: "He granted us six and favored us by seven: He bestowed upon us knowledge, forbearance, generosity, eloquence, courage, and love in the hearts of the believers; and among us, He preferred the chosen Prophet, the truthful, the swift, the lion of God and His Messenger, the leader of women, the stronghold of this nation, and the Mahdi of this nation. - Imam Zain al-Abidin (A.S)",
  ar: "أعطينا ستة وفضلنا بسبع: أعطينا العلم والحلم والسماحة والفصاحة والشجاعة والمحبّة في قلوب المؤمنين، وفضلنا بأن منّا النبي المختار، ومنّا الصدّيق، ومنّا الطيّار، ومنّا أسد الله وأسد رسوله، ومنّا سيّدة النساء، ومنّا سبطاً لهذه الأمة، ومنّا مهديّاً لهذه الأمة. - الإمام زين العابدين (ع)"
},

// Quotes from Imam al-Baqir
{
  en: "Stand for the truth, avoid what does not concern you, shun your enemy, and beware of your friend among the people—except the trustworthy who fear God; do not associate with the wicked nor reveal your secrets to them; and seek counsel from those who fear God in your affairs. - Imam al-Baqir (A.S)",
  ar: "قم بالحق، واعتزل ما لا يعنيك، وتجنب عدوك، واحذر صديقك من الأقوام، إلا الأمين من يخشى الله، ولا تصحب الفاجر ولا تطلعه على سرك، واستشر في أمرك الذين يخشون الله. - الإمام الباقر (ع)"
},
{
  en: "Three noble virtues in this world and the Hereafter are: forgiving those who wrong you, maintaining ties with those who sever you, and being patient when you are insulted. - Imam al-Baqir (A.S)",
  ar: "ثلاثة من مكارم الدنيا والآخرة: أن تعفو عمن ظلمك، وتصل من قطعك، وتحلم إذا جُهل عليك. - الإمام الباقر (ع)"
},
{
  en: "No act of worship is more beloved to Allah than chastity, and nothing pleases Him more than being held accountable; while the remedy for fate is supplication—and the reward for righteousness is swift, and the punishment for transgression swifter. It is enough of a flaw for a man to see in others what blinds him from his own faults, to command them in matters beyond his power, or to harm his companion in what concerns him. - Imam al-Baqir (A.S)",
  ar: "ما من عبادة لله تعالى أفضل من عفة بطن أو فرج، وما من شيء أحب إلى الله تعالى من أن يُسأل، وما يدفع القضاء إلى الدعاء. وإن أسرع الخير ثواباً البر والعدل، وأسرع الشر عقوبة البغي، وكفى بالمرء عيباً أن يبصر من الناس ما يعمى عنه من نفسه، وأن يأمرهم بما لا يستطيع التحول عنه، وأن يؤذي جليسه بما يعنيه. - الإمام الباقر (ع)"
},
{
  en: "Whoever speaks truth purifies his deeds; whoever has good intentions, his sustenance increases; and whoever is dutiful to his family, his lifespan is prolonged. - Imam al-Baqir (A.S)",
  ar: "من صدق لسانه زكا عمله، ومن حسنت نيته زيد في رزقه، ومن حسن بره بأهله زيد في عمره. - الإمام الباقر (ع)"
},
{
  en: "The most lamentable on the Day of Judgment is the one deemed just yet betrayed by others. - Imam al-Baqir (A.S)",
  ar: "إن أشد الناس حسرة يوم القيامة عبد وصف عدلاً ثم خالفه إلى غيره. - الإمام الباقر (ع)"
},
{
  en: "He who shows kindness to people brings goodness and ease in both his worldly life and the Hereafter; whereas depriving kindness paves the way for misfortune—unless God protects him. - Imam al-Baqir (A.S)",
  ar: "من أعطى الخلق والرفق فقد أعطى الخير والراحة، وحسن حاله في دنياه وآخرته، ومن حرم الخلق والرفق كان ذلك سبيلاً إلى كل شر وبلية، إلا من عصمه الله. - الإمام الباقر (ع)"
},
{
  en: "Recognize the love in your brother’s heart by the love in your own. - Imam al-Baqir (A.S)",
  ar: "اعرف المودة في قلب أخيك بما له في قلبك. - الإمام الباقر (ع)"
},
{
  en: "No arrogance entering a man’s heart fails to diminish his intellect in equal measure. - Imam al-Baqir (A.S)",
  ar: "ما دخل قلب امرئ شيء من الكبر إلا نقص من عقله مثله. - الإمام الباقر (ع)"
},
{
  en: "The death of a scholar is more beloved to Satan than the death of seventy worshippers. - Imam al-Baqir (A.S)",
  ar: "لموت عالم أحب إلى إبليس من موت سبعين عابداً. - الإمام الباقر (ع)"
},
{
  en: "Nothing endears brothers to you more than doing good to them. - Imam al-Baqir (A.S)",
  ar: "ليس شيء مميل الإخوان إليك مثل الإحسان إليهم. - الإمام الباقر (ع)"
},
{
  en: "If one does not make himself his own preacher, the admonitions of others will avail him nothing. - Imam al-Baqir (A.S)",
  ar: "من لم يجعل من نفسه واعظاً فإن مواعظ الناس لن تغني عنه شيئاً. - الإمام الباقر (ع)"
},
{
  en: "Only the true supporters of Ali are those generous in our leadership, loving in our affection, and united to revive the faith; if they are angry, they do not oppress, and if pleased, they do not overdo it. Blessings upon those who engage with them, and peace upon those who associate with them. - Imam al-Baqir (A.S)",
  ar: "إنما شيعة علي المتباذلون في ولايتنا، المتحابون في مودتنا، المتآزرون لإحياء الدين؛ إذا غضبوا لم يظلموا، وإذا رضوا لم يسرفوا. بركة على من حاورهم، وسلم لمن خالطهم. - الإمام الباقر (ع)"
},
{
  en: "The arrogant contends with God over His robe. - Imam al-Baqir (A.S)",
  ar: "المتكبر ينازع الله رداءه. - الإمام الباقر (ع)"
},
{
  en: "Wretched is the servant who has two faces and two tongues—one to praise his brother publicly and the other to speak ill of him in private. - Imam al-Baqir (A.S)",
  ar: "بئس العبد يكون ذا وجهين وذا لسانين، يطري أخاه في الله شاهداً، ويأكله غائباً. - الإمام الباقر (ع)"
},
{
  en: "He who disobeys God while outwardly proclaiming His love: if your love were sincere, you would obey Him. - Imam al-Baqir (A.S)",
  ar: "ما عرف الله من عصاه، وأنشد: تعصي الإله وأنت تظهر حبه، هذا لعمرك في الفعال بديع، لو كان حبك صادقاً لأطعته، إن المحب لمن أحب مطيع. - الإمام الباقر (ع)"
},
{
  en: "Modesty and faith are inseparable; when one departs, the other follows. - Imam al-Baqir (A.S)",
  ar: "الحياء والإيمان مقرونان في قرن، فإذا ذهب أحدهما تبعه صاحبه. - الإمام الباقر (ع)"
},
{
  en: "The believer is the brother of the believer—he neither insults him nor deprives him, nor does he harbor suspicions. - Imam al-Baqir (A.S)",
  ar: "إن المؤمن أخو المؤمن، لا يشتمه، ولا يحرمه، ولا يسيء به الظن. - الإمام الباقر (ع)"
},
{
  en: "Money acquired through usury, fraud, betrayal, or theft is not accepted as zakat, charity, Hajj, or Umrah. - Imam al-Baqir (A.S)",
  ar: "من أصاب مالاً من غلول أو ربا أو خيانة أو سرقة، لم يقبل منه في زكاة ولا في صدقة ولا في حج، ولا في عمرة. - الإمام الباقر (ع)"
},
{
  en: "Worse are the parents who overemphasize righteousness, and worse are the children who, when urged to piety, respond with neglect. - Imam al-Baqir (A.S)",
  ar: "شر الآباء من دعاه البر إلى الإفراط، وشر الأبناء من دعاه التقصير إلى العقوق. - الإمام الباقر (ع)"
},
{
  en: "It is enough of a flaw for a man to notice in others the faults that blind him to his own, to criticize what he cannot change, or to harm his companion in matters that do not concern him. - Imam al-Baqir (A.S)",
  ar: "كفى بالمرء عيباً أن يتعرف من عيوب الناس ما يعمى عليه من أمر نفسه، أو يعيب الناس على أمر هو فيه لا يستطيع التحول عنه، أو يؤذي جليسه بما لا يعنيه. - الإمام الباقر (ع)"
},

// Quotes from Imam Musa ibn Ja'far
{
  en: "Whoever wishes to be among the strongest should trust in God. - Imam Musa ibn Ja'far (A.S)",
  ar: "من أراد أن يكون أقوى الناس فليتوكل على الله. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The superiority of the jurist over the people is like the sun’s superiority over the planets; and whoever does not deeply understand his faith will not earn God’s favor. - Imam Musa ibn Ja'far (A.S)",
  ar: "فضل الفقيه على العباد كفضل الشمس على الكواكب، ومن لم يتفقه في دينه لم يرض الله له عملاً. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Strive to understand the religion of God, for jurisprudence is the key to insight, the perfection of worship, and the means to attain exalted ranks in both faith and worldly life. - Imam Musa ibn Ja'far (A.S)",
  ar: "تفقهوا في دين الله، فإن الفقه مفتاح البصيرة، وتمام العبادة، والسبب إلى المنازل الرفيعة والرتب الجليلة في الدين والدنيا. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The scholar is esteemed because of his knowledge; disregard his disputes. The ignorant is diminished by his ignorance—approach him with compassion and wisdom. - Imam Musa ibn Ja'far (A.S)",
  ar: "عظم العالم لعلمه ودع منازعته، وصغر الجاهل لجهله، ولا تطرده، وإنما قربه وعلمه. - الإمام موسى بن جعفر (ع)"
},
{
  en: "For the wise, even a little work is rewarded manifold, whereas for those driven by whims and ignorance, much work is rejected. - Imam Musa ibn Ja'far (A.S)",
  ar: "قليل العمل من العاقل مقبول مضاعف، وكثير العمل من أهل الهوى والجهل مردود. - الإمام موسى بن جعفر (ع)"
},
{
  en: "May God have mercy on a person who is knowledgeable in the faith, even if people do not recognize him. - Imam Musa ibn Ja'far (A.S)",
  ar: "رحم الله عبداً تفقه، عرف الناس ولا يعرفونه. - الإمام موسى بن جعفر (ع)"
},
{
  en: "There is nothing better allocated among people than reason; the sleep of a wise man is preferable to the sleeplessness of the ignorant. - Imam Musa ibn Ja'far (A.S)",
  ar: "ما قسم بين العباد أفضل من العقل، ونوم العاقل أفضل من سهر الجاهل. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Everything has evidence, and the evidence of reason is reflection. - Imam Musa ibn Ja'far (A.S)",
  ar: "لكل شيء دليل، ودليل العقل التفكر. - الإمام موسى بن جعفر (ع)"
},
{
  en: "When a believer dies, the angels weep for him and the earth mourns him. - Imam Musa ibn Ja'far (A.S)",
  ar: "إذا مات المؤمن بكت عليه الملائكة وبقاع الأرض. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The believer is like the two pans of a scale: as his faith increases, so does his trial. - Imam Musa ibn Ja'far (A.S)",
  ar: "المؤمن مثل كفتي الميزان، كلما زاد في إيمانه زاد في بلائه. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Walking briskly diminishes the splendor of the believer. - Imam Musa ibn Ja'far (A.S)",
  ar: "سرعة المشي تذهب ببهاء المؤمن. - الإمام موسى بن جعفر (ع)"
},
{
  en: "If one does not have a preacher within himself, his enemy—namely, Satan—will prevail over him. - Imam Musa ibn Ja'far (A.S)",
  ar: "من لم يكن له من نفسه واعظ، تمكن منه عدوه—أي الشيطان. - الإمام موسى بن جعفر (ع)"
},
{
  en: "A believer never goes without these five essentials: a miswak, a comb, a prayer rug, a tasbih with thirty-four beads, and a carnelian ring. - Imam Musa ibn Ja'far (A.S)",
  ar: "لا يخلو المؤمن خمسة: سواك، ومشط، وسجادة، وسبحة بها أربعة وثلاثون حبة، وخاتم عقيق. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Whoever speaks truth purifies his deeds; whoever has good intentions, his sustenance increases; and whoever is dutiful to his kin, his lifespan is prolonged. - Imam Musa ibn Ja'far (A.S)",
  ar: "من صدق لسانه زكى عمله، ومن حسنت نيته زيد في رزقه، ومن حسن بره بإخوانه وأهله مد في عمره. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The voluntary prayers are an offering to God for every believer. - Imam Musa ibn Ja'far (A.S)",
  ar: "صلاة النوافل قربان إلى الله لكل مؤمن. - الإمام موسى بن جعفر (ع)"
},
{
  en: "He who fails to hold himself accountable each day is not one of us; if he does good, God increases him, and if he errs, he repents and seeks forgiveness. - Imam Musa ibn Ja'far (A.S)",
  ar: "ليس منا من لم يحاسب نفسه في كل يوم؛ فإن عمل حسناً استزاد الله، وإن عمل سيئاً استغفر الله وتاب إليه. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Beware of jesting, for it diminishes the light of your faith and belittles your dignity. - Imam Musa ibn Ja'far (A.S)",
  ar: "إياك والمزاح، فإنه يذهب بنور إيمانك، ويستخف بمروءتك. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Honesty and fulfilling trust attract sustenance, while betrayal and lying lead to poverty and hypocrisy. - Imam Musa ibn Ja'far (A.S)",
  ar: "أداء الأمانة والصدق يجلبان الرزق، والخيانة والكذب يجلبان الفقر والنفاق. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Humility is giving to others what you would love to receive. - Imam Musa ibn Ja'far (A.S)",
  ar: "التواضع: أن تعطي الناس ما تحب أن تعطيه. - الإمام موسى بن جعفر (ع)"
},
{
  en: "You were only commanded to ask, not that we provide all the answers—that duty rests upon us. - Imam Musa ibn Ja'far (A.S)",
  ar: "أنما أمرتم أن تسئلوا، وليس علينا الجواب؛ إنما ذلك ألينا. - الإمام موسى بن جعفر (ع)"
},
{
  en: "I have discovered that true knowledge lies in: knowing your Lord, understanding what He has done to you, discerning what He expects of you, and recognizing what diverts you from your faith. - Imam Musa ibn Ja'far (A.S)",
  ar: "وجدت علم الناس في أربع: أولها أن تعرف ربك، والثانية أن تعرف ما صنع بك، والثالثة أن تعرف ما أراد منك، والرابعة أن تعرف ما يخرجك عن دينك. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Convey goodness, speak goodness, and do not be timid. - Imam Musa ibn Ja'far (A.S)",
  ar: "ابلغ خيراً وقل خيراً، ولا تكن إمعة. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The world is like sea water: the more a thirsty man drinks, the thirstier he becomes until it destroys him. - Imam Musa ibn Ja'far (A.S)",
  ar: "مثل الدنيا مثل ماء البحر، كلما شرب منه العطشان ازداد عطشاً حتى يقتله. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The world is like a snake—its touch is soft, yet its belly conceals deadly poison; the wise avoid it, while the naive are drawn to it. - Imam Musa ibn Ja'far (A.S)",
  ar: "مثل الدنيا مثل الحية، مسها لين وفي جوفها السم القاتل؛ يحذرها الرجال ذوو العقول، ويهوى إليها الصبيان. - الإمام موسى بن جعفر (ع)"
},
{
  en: "He who disregards his own judgment perishes; whoever abandons the Prophet’s household is led astray; and whoever forsakes God’s Book and the words of His Prophet commits disbelief. - Imam Musa ibn Ja'far (A.S)",
  ar: "من نظر برأيه هلك، ومن ترك أهل بيت نبيه ضل، ومن ترك كتاب الله وقول نبيه كفر. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Three things please the eye: looking at greenery, at flowing water, and at a handsome face. - Imam Musa ibn Ja'far (A.S)",
  ar: "ثلاثة يجلون البصر: النظر إلى الخضرة، والنظر إلى الماء الجاري، والنظر إلى الوجه الحسن. - الإمام موسى بن جعفر (ع)"
},
{
  en: "When firm water is prolonged, the body weakens and joints loosen; yet nourishing water strengthens the body, increases kidney fat, and fattens the frame. - Imam Musa ibn Ja'far (A.S)",
  ar: "وشعر الجسد إذا طال قطع ماء الصلب، وأرخى المفاصل، وورث الضعف والسل؛ وإن النورة تزيد في ماء الصلب، وتقوى البدن، وتزيد في شحم الكليتين، وتسمن البدن. - الإمام موسى بن جعفر (ع)"
},
{
  en: "He who is deprived of even an hour of his life is truly bereft. - Imam Musa ibn Ja'far (A.S)",
  ar: "المغبون من غبن عمره ساعة. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Wretched is the servant who has two faces and two tongues. - Imam Musa ibn Ja'far (A.S)",
  ar: "بئس العبد يكون ذا وجهين وذا لسانين. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Whoever seeks counsel will neither be destroyed when right nor be blamed when wrong. - Imam Musa ibn Ja'far (A.S)",
  ar: "من استشار لم يعدم عند الصواب مادحاً، وعند الخطأ عاذراً. - الإمام موسى بن جعفر (ع)"
},
{
  en: "God detests the sleeping servant; indeed, He detests the idle one. - Imam Musa ibn Ja'far (A.S)",
  ar: "أن الله ليبغض العبد النوام، إن الله ليبغض العبد الفارغ. - الإمام موسى بن جعفر (ع)"
},
{
  en: "No two wolves among the sheep compare to a Muslim eager for leadership out of vanity. - Imam Musa ibn Ja'far (A.S)",
  ar: "ما ذئبان ضاريان في غنم قد غاب عنه رعاؤها، باضر في دين مسلم من حب الرياسة. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The people of the earth are blessed if they fear God, fulfill their trust, and act upon truth. - Imam Musa ibn Ja'far (A.S)",
  ar: "أن أهل الأرض مرحومون ما يخافون، وأدوا الأمانة، وعملوا بالحق. - الإمام موسى بن جعفر (ع)"
},
{
  en: "It is recommended to discipline a young boy so that he becomes patient in old age, and it is fitting for a man to be generous to his family so that they do not wish for his death. - Imam Musa ibn Ja'far (A.S)",
  ar: "يستحب غرامة الغلام في صغره ليكون حليماً في كبره، وينبغي للرجل أن يوسع على عياله لئلا يتمنوا موته. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Flesh generates flesh, and fish melts the body. - Imam Musa ibn Ja'far (A.S)",
  ar: "اللحم ينبت اللحم، والسمك يذب الجسد. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Faith is a degree above Islam, piety above faith, and certainty above piety; nothing among people is less than certainty. - Imam Musa ibn Ja'far (A.S)",
  ar: "الإيمان فوق الإسلام بدرجة، والتقوى فوق الإيمان بدرجة، واليقين فوق التقوى بدرجة، وما قسم في الناس شيء أقل من اليقين. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Do not enter the bath on an empty stomach; eat something first. - Imam Musa ibn Ja'far (A.S)",
  ar: "لا تدخلوا الحمام على الريق، ولا تدخلوه حتى تطعموا شيئاً. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The only things to be kissed on the mouth are one’s wife and young child. - Imam Musa ibn Ja'far (A.S)",
  ar: "ليس القبلة على الفم إلا للزوجة والولد الصغير. - الإمام موسى بن جعفر (ع)"
},
{
  en: "The earth is never without a sign—and by God, I am that sign. - Imam Musa ibn Ja'far (A.S)",
  ar: "إن الأرض لا تخلو من حجة، وأنا والله ذلك الحجة. - الإمام موسى بن جعفر (ع)"
},
{
  en: "Nothing in the balance is heavier than sending blessings upon Muhammad and his family. - Imam Musa ibn Ja'far (A.S)",
  ar: "ما في الميزان شيء أثقل من الصلاة على محمد وآل محمد. - الإمام موسى بن جعفر (ع)"
},

// Quotes from Imam al-Ridha
{
  en: "Wealth only accumulates with five qualities: extreme miserliness, prolonged hope, prevailing greed, severance of kinship, and prioritizing this world over the Hereafter. - Imam al-Ridha (A.S)",
  ar: "لا يجتمع المال إلّا بخصال خمس: ببخل شديد، وأمل طويل، وحرص غالب، وقطيعة لرحم، وإيثار الدنيا على الآخرة. - الإمام الرضا (ع)"
},
{
  en: "Whoever loves a disobedient person becomes disobedient, and whoever loves an obedient one becomes obedient; whoever aids an oppressor is oppressive, and whoever deserts a just one is ungrateful. No one attains God’s guardianship except through obedience. - Imam al-Ridha (A.S)",
  ar: "من أحب عاصياً فهو عاص، ومن أحب مطيعاً فهو مطيع، ومن أعان ظالماً فهو ظالم، ومن خذل عادلاً فهو خاذل. ليس بين الله وبين أحد قرابة، ولا ينال أحد ولاية الله إلا بالطاعة. - الإمام الرضا (ع)"
},
{
  en: "The most wretched state of creation appears in three instances: at birth when one first sees the world, at death when one witnesses the Hereafter, and at resurrection when one sees judgments unknown in the worldly life. - Imam al-Ridha (A.S)",
  ar: "إن أوحش ما يكون هذا الخلق في ثلاثة مواطن: يوم يولد ويخرج من بطن أمه فيرى الدنيا، ويوم يموت فيعاين الآخرة وأهلها، ويوم يبعث فيرى أحكاما لم يرها في دار الدنيا. - الإمام الرضا (ع)"
},
{
  en: "The believer, in the sight of God, is like a near and dear king; indeed, nothing is more beloved to God than a repentant believer. - Imam al-Ridha (A.S)",
  ar: "مثل المؤمن عند الله عز وجل كمثل ملك مقرب، وإن المؤمن عند الله أعظم من ذلك، وليس شيئاً أحب إلى الله من مؤمن تائب أو مؤمنة تائبة. - الإمام الرضا (ع)"
},
{
  en: "Whoever speaks of the transmigration of souls is an infidel, for he denies the existence of Paradise and Hell. - Imam al-Ridha (A.S)",
  ar: "ما تقول في القائلين بالتناسخ؟ قال الإمام الرضا: من قال بالتناسخ فهو كافر بالله العظيم، يُكَذِّبُ بالجنة والنار. - الإمام الرضا (ع)"
},
{
  en: "When asked about 'Allah is the Light of the heavens and the earth', he replied: 'It is a guide for the people of the heavens and a guide for the people of the earth.' - Imam al-Ridha (A.S)",
  ar: "سُئل الإمام الرضا عن قول الله عز وجل (الله نور السماوات والأرض) فقال: هادٍ لأهل السماء وهادٍ لأهل الأرض. - الإمام الرضا (ع)"
},
{
  en: "Regarding monotheism, there are three approaches: negation, anthropomorphic depiction, and affirmation without likening—the acceptable way being the latter. - Imam al-Ridha (A.S)",
  ar: "للناس في التوحيد ثلاثة مذاهب: النفي، والتشبيه، والإثبات بغير تشبيه. فمذهب النفي لا يجوز، ومذهب التشبيه لا يجوز، والسبيل هو الإثبات بلا تشبيه. - الإمام الرضا (ع)"
},
{
  en: "‘There is no god but Allah’ comes with conditions—and I am among those who fulfill them. - Imam al-Ridha (A.S)",
  ar: "إن للا إله إلا الله شروطاً ألا، وإني من شروطها. - الإمام الرضا (ع)"
},
{
  en: "Worship has seventy facets, of which sixty-nine are about contentment and submission to Allah, His Messenger, and the rightly guided Imams. - Imam al-Ridha (A.S)",
  ar: "إن العبادة على سبعين وجهاً، فتسعة وستون منها في الرضا والتسليم لله عز وجل، ولرسوله، ولأولي الأمر. - الإمام الرضا (ع)"
},
{
  en: "The Messenger of God said: 'O Allah, have mercy on my successors, three times.' When asked who they are, he replied: 'Those who come after me and narrate my hadith and tradition.' - Imam al-Ridha (A.S)",
  ar: "قال رسول الله: اللهم ارحم خلفائي ثلاث مرات. قيل له: يا رسول الله، ومن خلفاؤك؟ قال: الذين يأتون من بعدي ويروون أحاديثي وسنتي. - الإمام الرضا (ع)"
},
{
  en: "O son of Abu Mahmoud, when people take divergent paths, adhere to our way; whoever sticks with us, we stick with him, and whoever departs, we depart. Even the slightest sign of faith, if one calls a pebble 'a seed' and disassociates from dissenters, holds the goodness of both this world and the Hereafter. - Imam al-Ridha (A.S)",
  ar: "يا ابن أبي محمود، إذا أخذ الناس يميناً وشمالاً، فألزم طريقتنا؛ فإنه من لزمنا لزمناه، ومن فارقنا فارقناه. وإن أدنى ما يخرج الرجل من الإيمان أن يقول للحصاة هذه نواة، ثم يدين بذلك ويبرأ ممن خالفه. يا ابن أبي محمود، احفظ ما حدثتك به، فقد جمعت لك فيه خير الدنيا والآخرة. - الإمام الرضا (ع)"
},
{
  en: "O Yunus, do not be troubled if a jewel in your hand is called a boulder by others; if you are on the right path with an approving Imam, what people say will not harm you. - Imam al-Ridha (A.S)",
  ar: "يا يونس، وما عليك أن لو كان في يدك اليمنى درة، ثم قال الناس بعرة أو بعرة وقال الناس درة، هل ينفعك شيئاً؟ فقلت: لا. فقال: هكذا أنت يا يونس، إذا كنت على الصواب وكان إمامك راضياً عنك، لم يضرك ما قال الناس. - الإمام الرضا (ع)"
},
{
  en: "Whoever learns knowledge to belittle the foolish, boast before scholars, or divert attention to elevate himself will secure his seat in Hell. - Imam al-Ridha (A.S)",
  ar: "من تعلم العلم ليماري به السفهاء، أو يباهي به العلماء، أو يصرف وجوه الناس إليه ليرئيسوه ويعظموه، فليتبوأ مقعده من النار. - الإمام الرضا (ع)"
},
{
  en: "Beware of a blow with a stick, for Satan runs with you and angels shun you; whoever stumbles with his mount and dies enters Hell. - Imam al-Ridha (A.S)",
  ar: "إياك والضربة بالصَّولجان، فإن الشيطان يركض معك والملائكة تنفر عنك، ومن عثر دابته فمات دخل النار. - الإمام الرضا (ع)"
},
{
  en: "The best our loved ones can do on a day of poverty, humiliation, and destitution is to aid a needy one from among us—to rise from his grave surrounded by angels to his rightful place in God's gardens. - Imam al-Ridha (A.S)",
  ar: "أفضل ما يقدمه العالم من محبينا وموالينا أمامه في يوم فقره، وفاقته، وذله، ومسكنته، أن يغيث في الدنيا مسكيناً من محبينا من يد ناصب عدو لله ولرسوله، يقوم من قبره والملائكة صفوف من شفير قبره إلى موضع محله من جنان الله. - الإمام الرضا (ع)"
},
{
  en: "The Messenger of God said: 'No claim without action, no claim and action without intention, and no claim, action, and intention without following the Sunnah.' - Imam al-Ridha (A.S)",
  ar: "قال رسول الله: لا قول إلا بعمل، ولا قول وعمل إلا بنية، ولا قول وعمل ونية إلا بإصابة السنة. - الإمام الرضا (ع)"
},
{
  en: "The Messenger of God said: 'Sitting with scholars, looking at Ali, gazing at the House, the Qur'an, and one's parents are all acts of worship.' - Imam al-Ridha (A.S)",
  ar: "قال رسول الله: مجالسة العلماء عبادة، والنظر إلى علي عبادة، والنظر إلى البيت عبادة، والنظر إلى المصحف عبادة، والنظر إلى الوالدين عبادة. - الإمام الرضا (ع)"
},
{
  en: "Whoever sits in a gathering where our affairs are discussed will have his heart enlivened, and his heart will not perish on the Day of Judgment. - Imam al-Ridha (A.S)",
  ar: "من جلس مجلساً يحيا فيه أمرنا، لم يمت قلبه يوم تموت القلوب. - الإمام الرضا (ع)"
},
{
  en: "Knowledge is the lost property of the believer. - Imam al-Ridha (A.S)",
  ar: "العلم ضالة المؤمن. - الإمام الرضا (ع)"
},
{
  en: "I love it when a believer is articulate—in answer to 'what does it mean to be articulate?' he replies, 'to make things clear.' - Imam al-Ridha (A.S)",
  ar: "إنّي أحب أن يكون المؤمن مُحدثاً. قيل: وما المُحدث؟ قال: المفهّم. - الإمام الرضا (ع)"
},
{
  en: "Whoever God has entrusted with a mind, He will one day rescue him with it. - Imam al-Ridha (A.S)",
  ar: "ما استودع الله عبداً عقلاً إلا استنقذه به يوماً. - الإمام الرضا (ع)"
},
{
  en: "A man’s best friend is his intellect, and his worst enemy is his ignorance. - Imam al-Ridha (A.S)",
  ar: "صديق كل امرئ عقله، وعدوه جهله. - الإمام الرضا (ع)"
},
{
  en: "The Imam is the trustworthy companion, the kind-hearted child, the devoted brother, akin to a nurturing mother for a young one, and the consoler of people. - Imam al-Ridha (A.S)",
  ar: "الإمام الأمين، الرفيق، والولد الشفيق، والأخ الشقيق، وكالأم البرة بالولد الصغير، ومفزع العباد. - الإمام الرضا (ع)"
},
{
  en: "The Imam is like the pouring cloud, the abundant rain, the shaded sky, the simple earth, the bountiful stream, and the garden. - Imam al-Ridha (A.S)",
  ar: "الإمام السحاب الماطر، والغيث الهاطل، والسماء الظليلة، والأرض البسيطة، والعين الغزيرة، والغدير، والروضة. - الإمام الرضا (ع)"
},
{
  en: "The Imam is like the radiant full moon, the brilliant lamp, the rising light, and the guiding star in the darkness—a proof of guidance and a savior from ruin. - Imam al-Ridha (A.S)",
  ar: "الإمام البدر المنير، والسراج الزاهر، والنور الطالع، والنجم الهادي في غيابات الدجى، والدليل على الهدى، والمنجي من الردى. - الإمام الرضا (ع)"
},
{
  en: "Whoever remembers God and does not hasten to meet Him has, in effect, ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من ذكر الله ولم يستبق إلى لقائه فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Whoever seeks refuge in God from the fire and does not abandon worldly desires has ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من تعوّذ بالله من النار ولم يترك شهوات الدنيا فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Whoever asks God for Paradise and does not endure hardships has ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من سأل الله الجنة ولم يصبر على الشدائد فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Whoever is resolute yet fails to exercise caution has ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من استحزم ولم يحذر فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Whoever asks God for success and does not strive has ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من سأل الله التوفيق ولم يجتهد فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Whoever seeks forgiveness with his tongue and does not repent in his heart has ridiculed himself. - Imam al-Ridha (A.S)",
  ar: "من استغفر بلسانه ولم يندم بقلبه فقد استهزأ بنفسه. - الإمام الرضا (ع)"
},
{
  en: "Walking signifies concern for something, and willpower is the drive to complete it. - Imam al-Ridha (A.S)",
  ar: "المشيةُ: الاهتمام بالشيء، والإرادةُ: إتمام ذلك الشيء. - الإمام الرضا (ع)"
},
{
  en: "Humility is knowing your own worth and lowering it in your heart, and approaching others only as much as is due. - Imam al-Ridha (A.S)",
  ar: "التواضع درجات منها أن يعرف المرء قدر نفسه فينزلها منزلتها بقلب سليم، ولا يحب أن يأتي إلى أحد إلا مثل ما يؤتى إليه. - الإمام الرضا (ع)"
},
{
  en: "Whoever burdens his intellect with affectation only cultivates ignorance. - Imam al-Ridha (A.S)",
  ar: "من تكلف العقل لم يزده إلا جهلاً. - الإمام الرضا (ع)"
},
{
  en: "Fear God regarding His blessings upon you; do not let your disobedience deprive you of them—maintain them through obedience and thankfulness. - Imam al-Ridha (A.S)",
  ar: "اتقوا الله أيها الناس في نعم الله عليكم؛ فلا تنفروها عنكم بمعاصيه، بل استديموها بطاعته وشكره على نعمه وأياديه. - الإمام الرضا (ع)"
},
{
  en: "The noblest and most honorable of creatures is the one who practices goodness, aids the distressed, fulfills the hope of the hopeful, and validates the aspirations of the yearning. - Imam al-Ridha (A.S)",
  ar: "أجل الخلائق وأكرمها: اصطناع المعروف، وإغاثة الملهوف، وتحقيق أمل الآمل، وتصديق مخيّلة الراجي. - الإمام الرضا (ع)"
},
{
  en: "Love, though it may bring hardship, is the call to struggle. - Imam al-Ridha (A.S)",
  ar: "الحب داعي المكاره. - الإمام الرضا (ع)"
},
{
  en: "Negligence is a calamity for one with ability. - Imam al-Ridha (A.S)",
  ar: "التفريط مصيبة ذي القدرة. - الإمام الرضا (ع)"
},
{
  en: "Faith is a degree above Islam, piety above faith, and certainty above piety. - Imam al-Ridha (A.S)",
  ar: "الإيمان فوق الإسلام بدرجة، والتقوى فوق الإيمان بدرجة، واليقين فوق التقوى بدرجة. - الإمام الرضا (ع)"
},
{
  en: "Associate with the ruler with caution, with the friend with humility, with the enemy with vigilance, and with the common people with benevolence. - Imam al-Ridha (A.S)",
  ar: "اصحب السلطان بالحذر، والصديق بالتواضع، والعدو بالتحرز، والعامة بالبِشر. - الإمام الرضا (ع)"
}
  ];
  
  export default dailyQuotes;
