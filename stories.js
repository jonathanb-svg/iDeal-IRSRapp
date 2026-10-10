/**
 * iDeaL® Assessment Database - Full 6-Story Master Dataset
 */

const WCPM_NORMS = {
  2: { beg: 29, mid: 29, end: 60 },
  3: { beg: 50, mid: 84, end: 100 },
  4: { beg: 83, mid: 97, end: 112 },
  5: { beg: 94, mid: 120, end: 133 },
  6: { beg: 121, mid: 133, end: 146 }
};

const STORIES = [
  {
    id: "honeymakers_y2_orange_nf",
    title: "Honeymakers",
    yearLevel: 2,
    colorLevel: "Orange",
    type: "Non-Fiction",
    totalWords: 128,
    text: `Jack's dad is a beekeeper. He looks after honeybees so he can collect their honey. The honeybees make a lot more honey than they need. Beekeepers take the extra honey.

Jack's dad makes hives for the bees to live in. He moves the hives around so the bees are always close to lots of flowers. The hives have frames inside them. The bees make honeycomb on the frames.

Bees get nectar from flowers. The nectar inside flowers is like sweet water. The bees take the nectar back to the hive. They put the nectar into the honeycomb. The bees beat their wings to make the nectar thicker. This helps turn the nectar into honey. When the honeycomb is full of honey, the bees put wax over the top.`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Beekeepers (Jack's dad) keep bees and collect extra honey",
            "Bees live in hives with frames to make honeycomb near flowers",
            "Bees collect nectar from flowers and take it back to the hive",
            "Bees beat their wings to thicken nectar into honey and seal it with wax"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_vocabulary",
        questionNumber: 2,
        type: "vocabulary",
        questionText: "What does the word 'beat' mean in this story?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["flap their wings quickly", "move wings fast", "flapping wings"],
          partialAnswers: ["move wings", "flap"]
        }
      },
      {
        id: "q3_literal",
        questionNumber: 3,
        type: "literal",
        questionText: "Why does Jack's dad move the hives around?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["so the bees are always close to lots of flowers", "so they are near flowers", "to keep them close to flowers"],
          partialAnswers: ["for flowers"]
        }
      },
      {
        id: "q4_literal",
        questionNumber: 4,
        type: "literal",
        questionText: "Why do the hives have frames inside them?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["for the bees to make the honeycomb on", "so bees can build honeycomb", "to make honeycomb"],
          partialAnswers: ["for honeycomb"]
        }
      },
      {
        id: "q5_inferential",
        questionNumber: 5,
        type: "inferential",
        questionText: "What would happen if bees could not get nectar from flowers?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["no honey could be made", "they couldn't make honey", "there would be no honey"],
          partialAnswers: ["no honey"]
        }
      }
    ]
  },
  {
    id: "butterfly_day_y2_turquoise_nf",
    title: "Butterfly Day",
    yearLevel: 2,
    colorLevel: "Turquoise",
    type: "Non-Fiction",
    totalWords: 133,
    text: `Last Tuesday, it was Butterfly Day in our classroom. The monarch caterpillars on our science table had been eating swan plant for days and days. We had watched them growing fatter and fatter. At last, they had crawled away and hung themselves upside down. Every caterpillar was safe inside its chrysalis.

On Tuesday morning, when we were doing maths, we noticed that a butterfly had come out of its chrysalis. It was opening and shutting its wings slowly. It stayed there for a long time, and then it started fluttering clumsily around the classroom. We caught it carefully, but it wouldn't stay on our hands. It kept crawling up on our clothing until it reached our heads. The butterfly crawled up Yong Lu's neck. It tickled. Yong Lu wasn't sure he liked that.`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Caterpillars on the science table eating swan plants and turning into chrysalises",
            "A butterfly emerged during maths time and started flying around",
            "Children tried to catch it but it climbed up their clothes onto their heads",
            "Butterfly crawled up Yong Lu's neck and tickled him"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_literal",
        questionNumber: 2,
        type: "literal",
        questionText: "How long had the caterpillars been eating swan plants for?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["days and days", "for days and days", "many days"],
          partialAnswers: ["days"]
        }
      },
      {
        id: "q3_vocabulary",
        questionNumber: 3,
        type: "vocabulary",
        questionText: "What does the word 'crawled' mean in this story?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["move slowly, creeped forward", "moving slowly on legs/body", "creeping slowly"],
          partialAnswers: ["moving", "walking"]
        }
      },
      {
        id: "q4_inferential",
        questionNumber: 4,
        type: "inferential",
        questionText: "Why was the butterfly opening and shutting its wings?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["to dry them out, to get ready to fly away", "drying its wings so it can fly", "getting ready to fly"],
          partialAnswers: ["drying wings"]
        }
      },
      {
        id: "q5_reaction",
        questionNumber: 5,
        type: "evaluative_reaction",
        questionText: "Would you like it if a butterfly crawled up your neck? Why or why not?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["Yes/No response accompanied by a clear personal reason linked to the text"],
          partialAnswers: ["yes", "no"]
        }
      }
    ]
  },
  {
    id: "life_on_aotea_y3_nf",
    title: "Life on Aotea",
    yearLevel: 3,
    type: "Non-Fiction",
    totalWords: 139,
    text: `Growing up on Aotea Great Barrier Island is fun. There's plenty to do: fishing, swimming, beachcombing, tramping. But there are challenges too. The island is off-grid, so people have to find their own water and make their own power. Some students from Okiwi School talk about life on the island.

Dylan

Aotea is about 90 kilometres from Auckland. I'd rather fly than go there on the ferry because I don't like being on deep, deep water. It also takes over four hours by boat, but only thirty minutes on a plane. It's expensive to buy food on Aotea because it's shipped from Auckland. Luckily, my family has a vegetable garden. We grow peppers, passionfruit, huge pumpkins - and my favourite, watermelon. We also grow tomatoes. When we have too many, we take them to school for the kids to eat.`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Living/growing up on Aotea Great Barrier Island (fun activities like fishing/swimming/tramping)",
            "Island is off-grid (people make own power/find own water)",
            "Travel options (90km from Auckland; plane takes 30 mins vs ferry taking 4+ hours)",
            "Food supply & gardens (expensive food shipped in, growing vegetables to eat/share at school)"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_literal",
        questionNumber: 2,
        type: "literal",
        questionText: "How far is Aotea from Auckland?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["about 90km from Auckland", "about 90 kilometres", "90 km"],
          partialAnswers: ["90"]
        }
      },
      {
        id: "q3_literal",
        questionNumber: 3,
        type: "literal",
        questionText: "Name two activities people can do on the island.",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["fishing and swimming", "beachcombing and tramping", "fishing, swimming, beachcombing, or tramping"],
          partialAnswers: ["fishing", "swimming", "tramping", "beachcombing"]
        }
      },
      {
        id: "q4_literal",
        questionNumber: 4,
        type: "literal",
        questionText: "Why does Dylan prefer to fly instead of taking the ferry?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["he doesn't like being on deep water", "because he doesn't like deep water", "it's faster (30 mins vs 4 hours)"],
          partialAnswers: ["doesn't like water"]
        }
      },
      {
        id: "q5_vocabulary",
        questionNumber: 5,
        type: "vocabulary",
        questionText: "What does 'off-grid' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["not connected to main power or water systems", "making your own power and getting your own water", "living without city electricity or town water"],
          partialAnswers: ["no power", "no water"]
        }
      },
      {
        id: "q6_inferential",
        questionNumber: 6,
        type: "inferential",
        questionText: "How does having a vegetable garden help Dylan's family?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["it's expensive to buy food on Aotea, growing vegetables is cheaper", "saves money because food shipped from Auckland is expensive", "provides food so they don't have to buy expensive shipped groceries"],
          partialAnswers: ["saves money", "food is expensive"]
        }
      },
      {
        id: "q7_evaluative",
        questionNumber: 7,
        type: "evaluative",
        questionText: "Do you think living on Aotea would be easy or hard? Why?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["Hard because it's off-grid and food is expensive, but fun because of the beaches", "Easy because there are lots of fun outdoor activities", "Any clear choice supported by evidence from the text"],
          partialAnswers: ["easy", "hard"]
        }
      },
      {
        id: "q8_reaction",
        questionNumber: 8,
        type: "evaluative_reaction",
        questionText: "Would you like to live on Aotea Great Barrier Island? Why or why not?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["Yes/No answer accompanied by a logical reason linked to the text"],
          partialAnswers: ["yes", "no"]
        }
      }
    ]
  },
  {
    id: "lost_little_penguin_y4_nf",
    title: "The Lost Little Penguin",
    yearLevel: 4,
    type: "Non-Fiction",
    totalWords: 165,
    text: `One spring morning, workers at an Auckland mall noticed a little penguin sitting on the footpath. It looked like it was waiting for the mall to open! People were worried. The mall isn't a home for a penguin. The little penguin had swum into Manukau Harbour, and when the water became muddy and shallow, it had climbed onto land.

Help arrives.

Karen Saunders came to the rescue. She took the penguin to the Native Bird Rescue centre, a place she set up to help birds in trouble. And this kororā was starving! The penguin was so hungry because he'd travelled a long way looking for food. To get him used to eating again, Karen made fish smoothies. They smelt horrible! Karen was glad when he was strong enough to eat small fish like anchovies and sprats: first one fish, then three, then eight each meal. Karen named the kororā Mānawa, after the mall where he was found. Manawa also means "heart" in te reo Māori.`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Penguin found outside an Auckland mall (swam into Manukau Harbour)",
            "Rescued by Karen Saunders and taken to Native Bird Rescue centre",
            "Fed fish smoothies then small fish to regain strength",
            "Named Mānawa after the mall / meaning 'heart' in te reo Māori"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_literal",
        questionNumber: 2,
        type: "literal",
        questionText: "Where was the penguin found?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["on a footpath at a mall in Auckland", "at an Auckland mall", "on the footpath outside the mall"],
          partialAnswers: ["at a mall", "Auckland"]
        }
      },
      {
        id: "q3_literal",
        questionNumber: 3,
        type: "literal",
        questionText: "What did Karen make for the penguin at first?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["fish smoothies", "a fish smoothie"],
          partialAnswers: ["smoothies"]
        }
      },
      {
        id: "q4_vocabulary",
        questionNumber: 4,
        type: "vocabulary",
        questionText: "What does 'rescue' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["to save or help someone in danger", "to save someone or something", "helping out when in trouble"],
          partialAnswers: ["save", "help"]
        }
      },
      {
        id: "q5_vocabulary",
        questionNumber: 5,
        type: "vocabulary",
        questionText: "What does 'starving' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["very, very hungry", "extremely hungry", "dying of hunger / needing food desperately"],
          partialAnswers: ["hungry"]
        }
      },
      {
        id: "q6_inferential",
        questionNumber: 6,
        type: "inferential",
        questionText: "Why were people worried about the penguin?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["it was in a place that was not safe for it", "a mall is no place for a wild penguin", "it was lost and could get hurt on the footpath"],
          partialAnswers: ["it was lost", "not safe"]
        }
      },
      {
        id: "q7_inferential",
        questionNumber: 7,
        type: "inferential",
        questionText: "Why did Karen start with fish smoothies?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["to help the penguin eat again slowly", "because the penguin was starving and couldn't eat solid fish yet", "to get his stomach used to food again"],
          partialAnswers: ["so it could eat", "it was starving"]
        }
      },
      {
        id: "q8_evaluative",
        questionNumber: 8,
        type: "evaluative",
        questionText: "What do you think might happen to Mānawa after he gets strong again?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["Mānawa will probably be taken back to the ocean and released", "He will go back into the wild/sea when he is healthy", "Released back into his natural habitat"],
          partialAnswers: ["go back to sea", "released"]
        }
      }
    ]
  },
  {
    id: "amazing_antics_y5_nf",
    title: "Amazing Antics - Life Inside an Ant Colony",
    yearLevel: 5,
    type: "Non-Fiction",
    totalWords: 181,
    text: `Ants are among the world's tiniest animals, so it's fair to think we have little in common. But like people, ants are social creatures that live and work together. An ant community is called a colony. A single colony (or nest) can be home for up to 100,000 ants. But there are even bigger colonies, known as supercolonies. They can have billions of ants!

Life together

Most ants build their nests underground. These nests have rooms, a bit like a house, and tunnels to connect them. Each room has a different purpose. There are nurseries for the young and separate spaces for storing food and waste and for the queen to lay eggs.

Some species of ant build their nests above ground. They live in tree trunks, flowers, and even acorns. Other species don't bother with a nest. South American army ants travel in huge swarms that raid other colonies for food. When it's time to rest, they form a big pile, making a shelter with their bodies. Ants have been on the planet for at least a hundred million years.`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Ants are social creatures living in colonies or supercolonies",
            "Underground nest structures (rooms for nursery, food, waste, queen)",
            "Above ground nests or no nests (tree trunks, acorns, army ants traveling in swarms)",
            "Ants have lived on Earth for at least 100 million years"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_literal",
        questionNumber: 2,
        type: "literal",
        questionText: "What is an ant community called?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["colony", "a colony", "supercolony"],
          partialAnswers: []
        }
      },
      {
        id: "q3_literal",
        questionNumber: 3,
        type: "literal",
        questionText: "Where do most ants build their nests?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["underground"],
          partialAnswers: ["ground"]
        }
      },
      {
        id: "q4_vocabulary",
        questionNumber: 4,
        type: "vocabulary",
        questionText: "What does 'colony' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["a large group of ants living and working together", "a group of ants living together", "an ant community or nest"],
          partialAnswers: ["a group", "a nest"]
        }
      },
      {
        id: "q5_vocabulary",
        questionNumber: 5,
        type: "vocabulary",
        questionText: "What does 'species' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["a type or kind of animal", "a specific kind of living creature", "a category or group of animals"],
          partialAnswers: ["a type", "kind"]
        }
      },
      {
        id: "q6_inferential",
        questionNumber: 6,
        type: "inferential",
        questionText: "Why might underground nests be a good place for ants to live?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["keeps ants safe from weather and predators", "protects them from rain and cold", "keeps them hidden and safe"],
          partialAnswers: ["safe", "keeps them warm"]
        }
      },
      {
        id: "q7_inferential",
        questionNumber: 7,
        type: "inferential",
        questionText: "Why do army ants travel in swarms instead of staying in one place?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["helps ants work together to attack other colonies for food", "so they can raid other colonies and find food together", "they travel together to find food and protect each other"],
          partialAnswers: ["for food", "to attack"]
        }
      },
      {
        id: "q8_reaction",
        questionNumber: 8,
        type: "evaluative_reaction",
        questionText: "Do you think ants are similar to humans? Why or why not?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["Yes, because they live and work together in communities and build house-like rooms", "No, because they are tiny insects, lay eggs, and don't live in actual houses like us", "Yes/No with a logical reason linked to the text"],
          partialAnswers: ["Yes", "No"]
        }
      }
    ]
  },
  {
    id: "pedal_powered_community_y6_nf",
    title: "Pedal-powered Community",
    yearLevel: 6,
    type: "Non-Fiction",
    totalWords: 213,
    text: `Picture a city where lots of people travel by bike. There's less pollution. Fewer traffic jams. The sound of dinging bells instead of the thrum of engines.

This city isn't imaginary. It's Ōtautahi Christchurch, a hundred years ago. At the time, 50 percent of the population used bikes to get around. Today, that figure is much lower - more like 7 percent - but it's on the rise, thanks to groups like RAD Bikes, the city's community bike workshop.

RADical changes

RAD Bikes (short for recycle a dunger) started in 2013, when the people of Ōtautahi were beginning to rebuild after the huge earthquakes of 2010 and 2011. They had big dreams for their redesigned city. Playgrounds, libraries, and a stadium were all on the list, but these were only part of the picture. People also wanted their city to be a healthier place to live, with plenty of opportunities to take better care of the environment.

The government and the local city council shared this vision - and getting more people on bikes seemed like a good place to start. Evidence showed that the world's "greenest" cities, such as Copenhagen, Amsterdam, Frankfurt, and Vancouver, had done just that. They'd built an extensive network of cycleways to make biking safe and convenient - and people loved it!`,
    questions: [
      {
        id: "q1_retell",
        questionNumber: 1,
        type: "retell",
        questionText: "Can you retell the main points of the text in detail?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          requiredKeyIdeasCount: 3,
          keyIdeas: [
            "Historical context (Christchurch/Ōtautahi used to have 50% bike use, now ~7%)",
            "RAD Bikes / Rebuilding after the 2010/2011 earthquakes",
            "Community/Council vision for a healthier, greener city",
            "International examples & building cycleways to make biking safe and convenient"
          ],
          rubricNote: "Award full credit if student retells at least 3 main points in detail."
        }
      },
      {
        id: "q2_literal",
        questionNumber: 2,
        type: "literal",
        questionText: "What percentage of people used bikes in the past?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["50 percent", "50%", "about 50 percent"],
          partialAnswers: ["50"]
        }
      },
      {
        id: "q3_literal",
        questionNumber: 3,
        type: "literal",
        questionText: "Name one thing people wanted in the rebuilt city.",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["playground", "playgrounds", "library", "libraries", "stadium", "healthier place to live", "opportunities to take care of the environment"],
          partialAnswers: []
        }
      },
      {
        id: "q4_vocabulary",
        questionNumber: 4,
        type: "vocabulary",
        questionText: "What does 'pollution' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["harmful substances in the environment", "dirty or dangerous things in the air or environment", "gasses or trash that ruin nature"],
          partialAnswers: ["dirty air", "rubbish"]
        }
      },
      {
        id: "q5_vocabulary",
        questionNumber: 5,
        type: "vocabulary",
        questionText: "What does 'rebuild' mean?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["build again after damage", "build something back up", "construct again"],
          partialAnswers: ["build again", "fix up"]
        }
      },
      {
        id: "q6_inferential",
        questionNumber: 6,
        type: "inferential",
        questionText: "Why do cycleways help increase bike use?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["they make cycling safer and easier", "makes biking safe and convenient", "keeps bikes away from dangerous traffic"],
          partialAnswers: ["safer", "easier"]
        }
      },
      {
        id: "q7_inferential",
        questionNumber: 7,
        type: "inferential",
        questionText: "Why might having more people riding bikes reduce pollution?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["bikes don't produce harmful gases like cars do", "fewer cars on the road making exhaust smoke", "no engines burning petrol"],
          partialAnswers: ["no engine smoke", "fewer cars"]
        }
      },
      {
        id: "q8_reaction",
        questionNumber: 8,
        type: "evaluative_reaction",
        questionText: "What are the benefits of biking instead of driving?",
        scoringGuide: {
          fullCreditMarks: 1.0,
          acceptableAnswers: ["keeps you fit and helps the environment", "less pollution and less traffic jams", "cheaper, healthier, and better for nature"],
          partialAnswers: ["helps environment", "keeps you fit"]
        }
      }
    ]
  }
];
