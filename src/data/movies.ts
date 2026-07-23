import { Movie } from '../types';

export const MOVIES: Movie[] = [
  {
    id: 'sintel',
    title: 'Sintel',
    description: 'A lonely young woman, Sintel, helps a wounded baby dragon which she names Scales. As Scales grows, they form a bond, but when a full-grown dragon snatches Scales away, Sintel embarks on an epic quest across treacherous lands.',
    genre: ['Animation', 'Fantasy', 'Adventure'],
    year: 2010,
    durationSeconds: 888, // 14 mins 48 secs
    rating: 'PG-13',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    qualityOptions: ['1080p', '720p', '480p'],
    subtitles: [
      { srclang: 'en', label: 'English', src: 'https://raw.githubusercontent.com/andreasronge/vtt-test/master/sintel-en.vtt' },
      { srclang: 'es', label: 'Spanish', src: '' },
      { srclang: 'fr', label: 'French', src: '' }
    ],
    director: 'Colin Levy',
    featured: true,
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit, Big Buck Bunny, wakes up on a sunny morning in a idyllic forest. When three mischievous forest bullies begin harassing innocent creatures, Bunny decides to take a hilarious stand for peace.',
    genre: ['Animation', 'Comedy', 'Family'],
    year: 2008,
    durationSeconds: 596, // 9 mins 56 secs
    rating: 'G',
    posterUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    qualityOptions: ['1080p', '720p', '480p'],
    subtitles: [
      { srclang: 'en', label: 'English', src: '' }
    ],
    director: 'Sacha Goedegebure',
    featured: true,
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    description: 'Set in a dystopian future Amsterdam, a ragtag team of scientists and fighters gather at the Oude Kerk to relive memories and attempt to save the world from a catastrophic robotic invasion.',
    genre: ['Sci-Fi', 'Action', 'Cyberpunk'],
    year: 2012,
    durationSeconds: 734, // 12 mins 14 secs
    rating: 'PG-13',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    qualityOptions: ['1080p', '720p', '480p'],
    subtitles: [
      { srclang: 'en', label: 'English', src: '' }
    ],
    director: 'Ian Hubert',
    featured: true,
  },
  {
    id: 'elephants-dream',
    title: 'Elephant\'s Dream',
    description: 'Proog and Emo explore a surreal giant machine world that bends to their imagination. When disagreement strikes, the mechanical environment turns hostile, challenging their very reality.',
    genre: ['Sci-Fi', 'Surreal', 'Animation'],
    year: 2006,
    durationSeconds: 653,
    rating: 'PG',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    qualityOptions: ['1080p', '720p'],
    director: 'Bassam Kurdali',
  },
  {
    id: 'for-bigger-blazes',
    title: 'Chromecast Odyssey: For Bigger Blazes',
    description: 'A breathtaking cinematic demonstration exploring extreme sports, mountain biking, and high-altitude wilderness landscapes in stunning 4K video quality.',
    genre: ['Documentary', 'Sports', 'Nature'],
    year: 2021,
    durationSeconds: 15,
    rating: 'G',
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    qualityOptions: ['1080p', '720p'],
    director: 'Google Creative Studio',
  },
  {
    id: 'subaru-outback',
    title: 'Wilderness Expedition 4K',
    description: 'Follow outdoor adventurers as they navigate rugged canyons, deep rivers, and foggy coastal pine forests on an unforgettable cross-country journey.',
    genre: ['Documentary', 'Adventure', 'Travel'],
    year: 2022,
    durationSeconds: 60,
    rating: 'G',
    posterUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnTheLoose.mp4',
    qualityOptions: ['1080p', '720p'],
    director: 'Wilderness Films',
  }
];
