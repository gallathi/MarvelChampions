// Boîtes et paquets de scénario : cocher une extension coche tout son contenu dans la collection.
// Les héros vendus seuls (paquets héros) ne sont pas listés : leur tuile suffit.
// Illustration : public/images/extensions/<id>.webp (puis `npm run content`).
// Un identifiant absent du catalogue fait échouer `npm test`.

export const EXTENSIONS = [
  {
    id: 'boite-de-base',
    name: 'Boîte de base',
    scenarios: ['rhino', 'klaw', 'ultron'],
    modules: ['alerte-a-la-bombe', 'les-maitres-du-mal', 'civils-attaques', 'legions-d-hydra', 'le-siege-de-l-apocalypse'],
    heroes: ['spider-man', 'captain-marvel', 'miss-hulk', 'iron-man', 'black-panther'],
  },
  {
    id: 'le-bouffon-vert',
    name: 'Le Bouffon Vert',
    scenarios: ['entreprise-a-risques', 'formule-mutagene'],
    modules: ['gadgets-du-bouffon', 'un-immense-gachis', 'absorption-electrique', 'ingerence-en-cours'],
  },
  {
    id: 'les-demolisseurs',
    name: 'Les Démolisseurs',
    scenarios: ['les-demolisseurs'],
  },
  {
    id: 'crane-rouge',
    name: 'L’avènement de Crâne Rouge',
    scenarios: ['crossbones', 'l-homme-absorbant', 'taskmaster', 'zola', 'crane-rouge'],
    modules: ['armes-experimentales', 'offensive-d-hydra', 'maitrise-des-armes', 'patrouille-d-hydra', 'hommes-de-main'],
    heroes: ['hawkeye', 'spider-woman'],
  },
  {
    id: 'kang',
    name: 'Kang le conquérant',
    scenarios: ['kang-le-conquerant'],
    modules: ['temporel', 'anachronautes', 'maitre-du-temps', 'kang-expert'],
  },
  {
    id: 'convoitise-galactique',
    name: 'Convoitise galactique',
    scenarios: ['la-confrerie-des-badoon', 'infiltrer-le-musee', 'fuir-le-musee', 'nebula', 'ronan-l-accusateur'],
    modules: [
      'troupe-de-badoon', 'traqueur-badoon', 'creatures-de-la-menagerie', 'artefacts-galatiques',
      'milices-kree', 'fanatique-kree', 'pirates-de-l-espace', 'controles-du-vaisseau', 'pierre-du-pouvoir',
      'explosion-au-raft', 'defis',
    ],
    heroes: ['groot', 'rocket-racoon'],
  },
];

/** Contenu d'une extension, par catégorie du catalogue. */
export const extensionItems = (ext) =>
  ['scenarios', 'modules', 'heroes'].map((cat) => [cat, ext[cat] ?? []]).filter(([, ids]) => ids.length);
