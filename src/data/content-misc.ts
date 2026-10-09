import type { SessionContent } from '../types'

/* Session content for the secondary demo paths: Spanish and Photography. */

export const miscSessions: Record<string, SessionContent> = {
  /* ---------------------------------------------------------- Spanish */
  'sp-1': {
    lesson: {
      id: 'lsn-sp-1',
      title: 'Greetings that sound natural',
      minutes: 15,
      intro:
        'You can learn twenty greetings from a list and still freeze in a hallway. This lesson picks the six you will actually use and shows how they change with the person in front of you.',
      blocks: [
        { type: 'h', text: 'The six that cover almost everything' },
        {
          type: 'list',
          items: [
            'Hola. Works for everyone, any time of day. If you only remember one, remember this.',
            'Buenos días / buenas tardes / buenas noches. The polite opener before a real conversation starts.',
            '¿Qué tal? Friendly and informal, close to "how\'s it going".',
            '¿Cómo estás? (tú) / ¿Cómo está usted? (usted). The difference is the register, not the meaning.',
            'Mucho gusto. "Nice to meet you" the moment names are exchanged.',
            'Hasta luego / hasta pronto. Leave-taking. "See you later" rather than a formal goodbye.',
          ],
        },
        { type: 'h', text: 'Tú or usted, decide once' },
        {
          type: 'p',
          text: 'Tú is informal, usted is formal. With one person you can usually tell within ten seconds: a shopkeeper you do not know, an older stranger, or a job interview gets usted. Friends, classmates and people your age get tú. Getting it wrong is rarely a disaster, but switching mid conversation is noticed, so pick early and stay consistent.',
        },
        {
          type: 'note',
          title: 'Practice tip',
          text: 'Say each greeting out loud once with a name attached. "Buenos días, Ana" trains the whole phrase, not just the words.',
        },
      ],
    },
    resource: {
      id: 'res-sp-1',
      title: 'Small talk that does not stall',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'Four openers, four follow ups, and how to keep a conversation going past the first exchange.',
      body: [
        'The fastest way to keep talking in Spanish is to answer, then throw the same question back. "Muy bien, ¿y tú?" carries an entire conversation longer than you would expect.',
        'Four follow ups cover most situations: ¿De dónde eres? ¿A qué te dedicas? ¿Cuánto tiempo llevas aquí? ¿Te gusta...? Each one opens a topic the other person can answer without searching for vocabulary.',
        'If you lose a word, do not stop. Describe it around: "el thing para abrir la puerta" gets a laugh and the word you wanted. Pausing to be perfect is what makes conversations die.',
        'Listen for the ending tone. Spanish questions rise at the end in writing you would see ¿ and ?, but spoken, the pitch tells you when it is your turn. Mimic the rhythm and you will sound more natural than someone with perfect grammar.',
      ],
    },
    practice: {
      id: 'prc-sp-1',
      title: 'Pick the right phrase',
      minutes: 10,
      brief: 'Four situations. Choose the phrase a local would actually use.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'Walking into a small bakery in the morning',
          detail: 'First words to the owner',
          options: ['Buenos días', '¿Qué tal?', 'Hasta luego'],
          correctIndex: 0,
          feedback: 'Time of day plus a polite opener. Buenos días before anything else.',
        },
        {
          id: 'i2',
          label: 'A colleague your age asks how your weekend was',
          detail: 'Informal, quick reply',
          options: ['¿Cómo está usted?', 'Muy bien, ¿y tú?', 'Mucho gusto'],
          correctIndex: 1,
          feedback: 'Informal register, and returning the question keeps it moving.',
        },
        {
          id: 'i3',
          label: 'You are leaving the bakery with your bread',
          detail: 'Last words to the owner',
          options: ['Hasta luego', 'Buenas noches', '¿De dónde eres?'],
          correctIndex: 0,
          feedback: 'Hasta luego is the everyday leave-taking. You will hear it constantly.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-sp-1',
      title: 'Check your understanding',
      intro: 'Three questions on greetings and register.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'You are speaking to a stranger twice your age in a shop. Which form do you use?',
          choices: ['¿Qué tal estás?', '¿Cómo está usted?', '¿Cómo estás, tío?', 'Hola, brother'],
          correctIndex: 1,
          explanation:
            'Usted is the formal register, and a stranger in that situation calls for it. The others are too familiar.',
        },
        {
          id: 'q2',
          prompt: 'Someone asks ¿Cómo estás? How do you answer and keep it going?',
          choices: [
            'Muy bien, ¿y tú?',
            'Estoy aquí',
            'Buenos días',
            'Mucho gusto',
          ],
          correctIndex: 0,
          explanation:
            'Answer, then return the question. It is the smallest complete conversation in the language.',
        },
        {
          id: 'q3',
          prompt: 'You forget the word for "stairs". What should you do?',
          choices: [
            'Stop the conversation and check your phone',
            'Switch to English for the whole conversation',
            'Describe it, for example las escaleras para subir',
            'Pretend you did not need the word',
          ],
          correctIndex: 2,
          explanation:
            'Talking around a gap keeps the conversation alive and the other person will supply the word.',
        },
      ],
    },
  },

  'sp-2': {
    lesson: {
      id: 'lsn-sp-2',
      title: 'Present tense for real conversations',
      minutes: 15,
      intro:
        'The present tense carries most early conversations. Learn the three verb families once, then notice how much you can say before you need anything else.',
      blocks: [
        { type: 'h', text: 'Three endings, one pattern' },
        {
          type: 'list',
          items: [
            'Hablar (to speak): hablo, hablas, habla, hablamos, habláis, hablan.',
            'Comer (to eat): como, comes, come, comemos, coméis, comen.',
            'Vivir (to live): vivo, vives, vive, vivimos, vivís, viven.',
          ],
        },
        {
          type: 'p',
          text: 'Swap the ending, keep the stem. Almost every regular verb in the language follows one of these three. The only irregulars worth memorising now are ser, estar, tener, ir, hacer and querer, because you will use them in every single conversation.',
        },
        { type: 'h', text: 'Ser and estar, the difference that matters' },
        {
          type: 'p',
          text: 'Ser describes what something is: soy profesora, es martes, es caro. Estar describes a state or position: estoy cansado, está en la oficina, está bien. The trick: if you could change it tomorrow without changing what the thing is, it is estar.',
        },
        { type: 'h', text: 'Build sentences you will actually say' },
        {
          type: 'steps',
          items: [
            'Trabajo en... (I work at...) with any place you know.',
            'Me gusta... + noun, for anything you like.',
            'Vivo en... and Tengo... + number, for the basics about yourself.',
            '¿Dónde está...? for every question you need while moving through a city.',
          ],
        },
        {
          type: 'note',
          title: 'Key idea',
          text: 'Do not chase every irregular. Six high frequency verbs and three endings give you hundreds of usable sentences this week.',
        },
      ],
    },
    resource: {
      id: 'res-sp-2',
      title: 'Ten sentences that carry a first conversation',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'A short list you can learn in one sitting and use the same day.',
      body: [
        'Introduce yourself and turn the question around: Me llamo Sam, ¿y tú? Then: ¿De dónde eres? Almost everyone will answer at length, which buys you listening time.',
        'Talk about yourself in the present: Vivo en... / Trabajo en... / Estudio... Three sentences that cover the first five minutes of any meeting.',
        'Show interest: ¿A qué te dedicas? and ¿Te gusta...? are openers that need one word from you and give you a paragraph back.',
        'Buy yourself time: Un momento, por favor. and ¿Puedes repetir, más despacio? are not signs of failure, they are tools native speakers use constantly.',
        'Close warmly: Ha sido un placer. Muchas gracias. Hasta luego. Ending well matters as much as starting well, and these three work with anyone.',
      ],
    },
    practice: {
      id: 'prc-sp-2',
      title: 'Choose the correct form',
      minutes: 10,
      brief: 'Fill the gap with the form that fits the subject and the meaning.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'Yo ___ en Madrid. (live)',
          detail: 'Talking about yourself',
          options: ['vivo', 'vive', 'vivimos'],
          correctIndex: 0,
          feedback: 'First person singular of vivir: vivo.',
        },
        {
          id: 'i2',
          label: 'Nosotros ___ cansados hoy.',
          detail: 'A temporary state',
          options: ['somos', 'estamos', 'tenemos'],
          correctIndex: 1,
          feedback: 'A changeable state uses estar, and nosotros gives estamos.',
        },
        {
          id: 'i3',
          label: 'Ella ___ profesora.',
          detail: 'What she is for a living',
          options: ['está', 'tiene', 'es'],
          correctIndex: 2,
          feedback: 'Identity and role use ser: ella es profesora.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-sp-2',
      title: 'Check your understanding',
      intro: 'Three questions on the present tense.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'Which sentence means "I work in a hospital"?',
          choices: [
            'Estoy en un hospital',
            'Trabajo en un hospital',
            'Tengo un hospital',
            'Soy un hospital',
          ],
          correctIndex: 1,
          explanation:
            'Trabajar takes an en plus the place. Estar would only say you are physically there right now.',
        },
        {
          id: 'q2',
          prompt: 'Choose the right verb: Mi oficina ___ en el centro.',
          choices: ['es', 'está', 'hay', 'tiene'],
          correctIndex: 1,
          explanation:
            'Location of a thing uses estar: está en el centro. Ser would describe what the office is, not where it sits.',
        },
        {
          id: 'q3',
          prompt: 'What does ¿A qué te dedicas? ask?',
          choices: [
            'Where do you live?',
            'What do you do for work?',
            'How old are you?',
            'Where are you from?',
          ],
          correctIndex: 1,
          explanation:
            'It is the standard way to ask what someone does. ¿De dónde eres? is the one about where they are from.',
        },
      ],
    },
  },

  /* ------------------------------------------------------- Photography */
  'ph-1': {
    lesson: {
      id: 'lsn-ph-1',
      title: 'The exposure triangle in plain terms',
      minutes: 15,
      intro:
        'Aperture, shutter speed and ISO are three dials controlling one thing: how much light reaches the sensor. Learn to think of them as trade offs, not settings.',
      blocks: [
        { type: 'h', text: 'One decision, three dials' },
        {
          type: 'list',
          items: [
            'Aperture: how wide the opening is. Wide means more light and a blurrier background. Narrow means less light and everything sharp.',
            'Shutter speed: how long the sensor looks. Fast freezes motion. Slow drags light in and turns movement into streaks.',
            'ISO: how much you amplify the signal. Raise it and you can shoot in darker rooms, at the cost of grain.',
          ],
        },
        {
          type: 'p',
          text: 'They compensate for each other. If you close the aperture to keep the background sharp, you must slow the shutter or raise the ISO to keep the same brightness. Every photograph is that negotiation.',
        },
        { type: 'h', text: 'A starting order that works' },
        {
          type: 'steps',
          items: [
            'Decide the shutter first, based on movement. Walking people: 1/250. A child running: 1/500 or faster.',
            'Then the aperture, based on how much of the scene you want sharp.',
            'Then ISO as the leftover, as low as the light allows, raised only when you must.',
          ],
        },
        {
          type: 'note',
          title: 'Key idea',
          text: 'Sharpness of the wrong thing is still the wrong photograph. Decide what should be sharp before you touch a dial.',
        },
      ],
    },
    resource: {
      id: 'res-ph-1',
      title: 'Metering, exposure compensation and the histogram',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'Why the camera sometimes gets it wrong, and the two second fix you can apply in any mode.',
      body: [
        'Your camera meters for one thing: an average grey. Point it at a snowy field and it darkens the scene to reach grey. Point it at a black jacket and it brightens everything. The meter is not wrong, it is just unaware of your subject.',
        'Exposure compensation is the override. Bright scene or backlit face: dial in plus one third to plus one stop. Dark scene you want to stay dark: dial it down. This one control fixes more exposures than any mode dial.',
        'The histogram is the honest version of your preview. Bars jammed against the left wall mean lost shadow detail. Jammed right, lost highlights. A gentle hill with room on both sides means you captured everything the sensor could see.',
        'Shoot in RAW while you learn. It forgives a half stop of error in either direction, which is exactly the margin you are trying to build judgement about.',
      ],
    },
    practice: {
      id: 'prc-ph-1',
      title: 'Set the shot',
      minutes: 10,
      brief: 'Three scenes. Choose the setting that serves the picture, not the exposure meter.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'A friend walking towards you at dusk',
          detail: 'Street light only, they are moving',
          options: ['1/30 to hold ISO low', '1/250, ISO raised as needed', 'f/22 for maximum depth'],
          correctIndex: 1,
          feedback:
            'Movement sets the shutter first. 1/250 keeps them sharp, and you accept some ISO grain for it.',
        },
        {
          id: 'i2',
          label: 'A group portrait against a bright window',
          detail: 'Faces falling into shadow',
          options: ['Exposure compensation plus one stop', 'Meter off the window', 'Shutter at 1/1000'],
          correctIndex: 0,
          feedback:
            'The meter reads the bright window and underexposes the faces. Compensate up and the faces come back.',
        },
        {
          id: 'i3',
          label: 'A waterfall you want silky',
          detail: 'Tripod on, no people in frame',
          options: ['1/500 to freeze it', 'Half a second or slower', 'ISO 3200'],
          correctIndex: 1,
          feedback:
            'Slow shutter is the whole idea. With a tripod you can afford a long exposure without camera shake.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-ph-1',
      title: 'Check your understanding',
      intro: 'Three questions on exposure.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'You want a sharp subject with a soft, blurry background. What do you change first?',
          choices: [
            'Open the aperture wider',
            'Close the aperture to f/16',
            'Raise the ISO',
            'Speed up the shutter',
          ],
          correctIndex: 0,
          explanation:
            'A wide aperture gives the shallow depth of field that separates your subject from the background.',
        },
        {
          id: 'q2',
          prompt: 'Why does a photo of fresh snow come out grey?',
          choices: [
            'The lens was dirty',
            'The meter exposes for average grey and darkens the bright scene',
            'The shutter was too slow',
            'White balance is always wrong in winter',
          ],
          correctIndex: 1,
          explanation:
            'The camera has no idea you are photographing snow. It averages to grey, so you compensate up.',
        },
        {
          id: 'q3',
          prompt: 'Which combination is riskiest for a moving child in low light?',
          choices: [
            '1/500 at ISO 1600',
            '1/250 at ISO 800',
            '1/60 at ISO 100',
            '1/1000 at ISO 3200',
          ],
          correctIndex: 2,
          explanation:
            'At 1/60 the child will blur, and the low ISO means you probably could not expose it anyway. Speed matters more here than cleanliness.',
        },
      ],
    },
  },

  'ph-2': {
    lesson: {
      id: 'lsn-ph-2',
      title: 'Reading light before you read settings',
      minutes: 15,
      intro:
        'Good photographs come from noticing light, not from memorising settings. The settings only translate what you have already seen.',
      blocks: [
        { type: 'h', text: 'Four things to notice' },
        {
          type: 'list',
          items: [
            'Direction. Light from the side gives texture and shape. Light from behind gives silhouettes. Front on gives flatness, which suits documents and little else.',
            'Quality. Hard light (small source, direct sun) draws sharp shadows. Soft light (overcast, window, shade) wraps around and flatters faces.',
            'Colour. Late afternoon is warm, shade is cool, office light is green. Decide whether to keep the cast or correct it.',
            'Contrast. The gap between your brightest highlight and darkest shadow. Most cameras handle a moderate range easily and lose the extremes.',
          ],
        },
        { type: 'h', text: 'The five minute exercise' },
        {
          type: 'p',
          text: 'Stand in one spot and photograph the same subject four times: facing the light, side on, backlit, and in shade. Compare them on the camera screen. Nothing teaches the effect of direction faster than four frames of the same thing.',
        },
        {
          type: 'note',
          title: 'Key idea',
          text: 'Chase the light, not the subject. The same object at 8am and 4pm are two different photographs.',
        },
      ],
    },
    resource: {
      id: 'res-ph-2',
      title: 'Golden hour, open shade and why overcast is a studio',
      kind: 'article',
      source: 'Sawari Reader',
      minutes: 10,
      summary: 'A practical guide to the three lighting conditions worth planning your shoots around.',
      body: [
        'Golden hour is the hour after sunrise and before sunset. The sun sits low, so light travels sideways through more atmosphere: warmer, softer shadows, and a direction that sculpts faces. It is popular for a reason, but it is also short, so arrive early and know your shot before it starts.',
        'Open shade is the underrated one. Stand just inside a doorway or under a tree, with the bright sky in front of you. The subject gets even, soft light with no squinting, and you still have plenty of illumination. Portraits in open shade are consistently better than portraits in open sun.',
        'Overcast days are a giant softbox. Shadows disappear, colour saturates, and you can shoot at any hour without fighting contrast. The trade off is a flat sky, so keep it out of the frame or use it as a clean background.',
        'Midday sun is not useless, it is just specific. Hard shadows make strong graphic shapes, and dark backgrounds with a spotlit subject can look dramatic. Take the same walk at noon you would take at six and you will see different pictures.',
      ],
    },
    practice: {
      id: 'prc-ph-2',
      title: 'Match the light to the subject',
      minutes: 10,
      brief: 'Three shooting situations. Choose the lighting condition that serves them best.',
      kind: 'classify',
      items: [
        {
          id: 'i1',
          label: 'A portrait of a friend who dislikes being photographed',
          detail: 'Outdoors, mid morning',
          options: ['Direct sun at noon', 'Open shade with bright sky in front', 'Backlit against the sun'],
          correctIndex: 1,
          feedback:
            'Open shade gives even, soft light with no squinting. It is the kindest light for an uncomfortable subject.',
        },
        {
          id: 'i2',
          label: 'A moody shot of a fire escape',
          detail: 'You want strong graphic shadows',
          options: ['Open shade', 'Hard midday sun', 'Overcast midday'],
          correctIndex: 1,
          feedback:
            'Hard light draws the sharp shadow lines that give the image its geometry. Flat light would remove the subject entirely.',
        },
        {
          id: 'i3',
          label: 'A set of food photos for a menu',
          detail: 'Consistency across twenty dishes',
          options: ['Golden hour window light', 'Overcast daylight or a soft window', 'Direct flash on camera'],
          correctIndex: 1,
          feedback:
            'Even, repeatable soft light means every plate looks like it belongs on the same menu.',
        },
      ],
      prompt: '',
    },
    assessment: {
      id: 'asm-ph-2',
      title: 'Check your understanding',
      intro: 'Three questions on reading light.',
      minutes: 10,
      questions: [
        {
          id: 'q1',
          prompt: 'Which light direction adds the most texture and depth to a subject?',
          choices: [
            'Light from directly behind the camera',
            'Light from the side',
            'Light from directly behind the subject',
            'Overhead light with no direction',
          ],
          correctIndex: 1,
          explanation:
            'Side light rakes across the surface, drawing small shadows that reveal texture and form.',
        },
        {
          id: 'q2',
          prompt: 'You are shooting portraits outdoors at midday and the subject is squinting. Best fix?',
          choices: [
            'Ask them to stop squinting',
            'Move them into open shade with the bright sky in front',
            'Switch to black and white',
            'Use a faster shutter speed',
          ],
          correctIndex: 1,
          explanation:
            'Open shade removes the hard light causing the squint while keeping plenty of soft illumination.',
        },
        {
          id: 'q3',
          prompt: 'What is the main benefit of an overcast day?',
          choices: [
            'You can shoot longer exposures',
            'Colours saturate and shadows soften, giving even light all day',
            'The camera focuses faster',
            'You no longer need to set white balance',
          ],
          correctIndex: 1,
          explanation:
            'Cloud cover diffuses the sun into one large soft source. Even light, richer colour, no harsh shadows.',
        },
      ],
    },
  },
}
