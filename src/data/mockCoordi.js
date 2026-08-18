import avatarHero from '../assets/coordi/avatar-hero.jpg'
import itemJacket from '../assets/coordi/item-jacket.jpg'
import itemTote from '../assets/coordi/item-tote.jpg'
import rec1 from '../assets/coordi/rec-1.jpg'
import rec2 from '../assets/coordi/rec-2.jpg'
import hairstyleShort from '../assets/coordi/hairstyle-short.jpg'
import hairstyleWave from '../assets/coordi/hairstyle-wave.jpg'
import hairstyleBob from '../assets/coordi/hairstyle-bob.jpg'

const HAIRSTYLES = [
  { id: 'short', label: '숏컷', image: hairstyleShort },
  { id: 'long-wave', label: '롱웨이브', image: hairstyleWave },
  { id: 'bob', label: '보브', image: hairstyleBob },
]

export const JACKET = {
  name: 'Classic Leather Biker Jacket',
  image: itemJacket,
  colors: ['black', 'cognac'],
  defaultColor: 'black',
  sizes: ['S', 'M', 'L'],
  defaultSize: 'M',
}

export const TOTE = {
  name: 'Visetos Original Tote',
  image: itemTote,
  colors: ['black', 'cognac', 'white'],
  defaultColor: 'cognac',
  sizes: ['S', 'L'],
  defaultSize: 'S',
}

export const MOCK_COORDI = {
  'avatar-demo': {
    heroImage: avatarHero,
    tags: ['LEATHER JACKET', 'VISETOS TOTE'],
    hairstyles: HAIRSTYLES,
    wornItems: [JACKET, TOTE],
    recommendations: [
      { id: 'sim-1', label: 'Crossbody Bag', image: rec1 },
      { id: 'sim-2', label: 'Card Holder', image: rec2 },
    ],
  },
  'scan-result': {
    heroImage: avatarHero,
    tags: ['VISETOS TOTE'],
    hairstyles: HAIRSTYLES,
    wornItems: [TOTE],
    recommendations: [
      { id: 'sim-1', label: 'Crossbody Bag', image: rec1 },
      { id: 'sim-2', label: 'Card Holder', image: rec2 },
    ],
  },
}

export const DEFAULT_COORDI = MOCK_COORDI['avatar-demo']
