export interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  image: string;
  brand: string;
  category: string;
}

export interface FilterQuestion {
  id: string;
  question: string;
  options: string[];
}

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'MacBook Pro 13" 2020 - M1 Chip, 8GB RAM',
    price: 850,
    condition: 'Excellent',
    location: 'New York, NY',
    image: 'https://images.unsplash.com/photo-1675668409245-955188b96bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWNib29rJTIwbGFwdG9wfGVufDF8fHx8MTc2NzYzMDcyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Laptops'
  },
  {
    id: '2',
    title: 'iPhone 12 Pro 128GB - Pacific Blue',
    price: 499,
    condition: 'Good',
    location: 'Los Angeles, CA',
    image: 'https://images.unsplash.com/photo-1567141579811-d507c3b05d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBzbWFydHBob25lfGVufDF8fHx8MTc2NzY3MzYzOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Smartphones'
  },
  {
    id: '3',
    title: 'Samsung Galaxy S21 Ultra 256GB',
    price: 599,
    condition: 'Like New',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1691449808001-bb8c157f0094?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwcGhvbmV8ZW58MXx8fHwxNzY3NjI5MTYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Samsung',
    category: 'Smartphones'
  },
  {
    id: '4',
    title: 'Dell XPS 15 - i7, 16GB RAM, 512GB SSD',
    price: 950,
    condition: 'Excellent',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1666627949395-bba2b22bf4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxsJTIwbGFwdG9wJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY3NzAyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Dell',
    category: 'Laptops'
  },
  {
    id: '5',
    title: 'iPad Pro 11" 2021 - 128GB, Space Gray',
    price: 649,
    condition: 'Like New',
    location: 'Seattle, WA',
    image: 'https://images.unsplash.com/photo-1672298597883-aba600a9b5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGFkJTIwdGFibGV0fGVufDF8fHx8MTc2NzYwMTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Tablets'
  },
  {
    id: '6',
    title: 'Sony WH-1000XM4 Noise Cancelling Headphones',
    price: 249,
    condition: 'Good',
    location: 'Portland, OR',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb255JTIwaGVhZHBob25lc3xlbnwxfHx8fDE3Njc3MDI5MDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Sony',
    category: 'Audio'
  },
  {
    id: '7',
    title: 'Canon EOS R6 Mirrorless Camera Body',
    price: 1899,
    condition: 'Excellent',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1613235577937-9ac3eed992fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5vbiUyMGNhbWVyYXxlbnwxfHx8fDE3Njc3MDI5MDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Canon',
    category: 'Cameras'
  },
  {
    id: '8',
    title: 'Apple AirPods Pro (2nd Generation)',
    price: 179,
    condition: 'Like New',
    location: 'Boston, MA',
    image: 'https://images.unsplash.com/photo-1695634463799-8cdf7a6a2595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb2RzJTIwZWFyYnVkc3xlbnwxfHx8fDE3Njc2MjM2NDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Audio'
  },
  {
    id: '9',
    title: 'HP Pavilion 15 - Ryzen 5, 8GB RAM',
    price: 399,
    condition: 'Good',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1666627949395-bba2b22bf4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxsJTIwbGFwdG9wJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY3NzAyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'HP',
    category: 'Laptops'
  },
  {
    id: '10',
    title: 'Samsung Galaxy Tab S8 - 128GB',
    price: 449,
    condition: 'Excellent',
    location: 'Phoenix, AZ',
    image: 'https://images.unsplash.com/photo-1672298597883-aba600a9b5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGFkJTIwdGFibGV0fGVufDF8fHx8MTc2NzYwMTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Samsung',
    category: 'Tablets'
  },
  {
    id: '11',
    title: 'Lenovo ThinkPad X1 Carbon - i5, 16GB',
    price: 799,
    condition: 'Good',
    location: 'Philadelphia, PA',
    image: 'https://images.unsplash.com/photo-1666627949395-bba2b22bf4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxsJTIwbGFwdG9wJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY3NzAyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Lenovo',
    category: 'Laptops'
  },
  {
    id: '12',
    title: 'iPhone 13 Mini 128GB - Midnight',
    price: 549,
    condition: 'Excellent',
    location: 'San Diego, CA',
    image: 'https://images.unsplash.com/photo-1567141579811-d507c3b05d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBzbWFydHBob25lfGVufDF8fHx8MTc2NzY3MzYzOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Smartphones'
  },
  {
    id: '13',
    title: 'Sony A7 III Camera Body',
    price: 1599,
    condition: 'Like New',
    location: 'Atlanta, GA',
    image: 'https://images.unsplash.com/photo-1613235577937-9ac3eed992fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5vbiUyMGNhbWVyYXxlbnwxfHx8fDE3Njc3MDI5MDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Sony',
    category: 'Cameras'
  },
  {
    id: '14',
    title: 'Dell Inspiron 14 - i3, 8GB RAM',
    price: 299,
    condition: 'Fair',
    location: 'Dallas, TX',
    image: 'https://images.unsplash.com/photo-1666627949395-bba2b22bf4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxsJTIwbGFwdG9wJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY3NzAyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Dell',
    category: 'Laptops'
  },
  {
    id: '15',
    title: 'MacBook Air M2 2022 - 8GB RAM, 256GB',
    price: 949,
    condition: 'Like New',
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1675668409245-955188b96bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWNib29rJTIwbGFwdG9wfGVufDF8fHx8MTc2NzYzMDcyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Apple',
    category: 'Laptops'
  },
  {
    id: '16',
    title: 'Samsung Galaxy Buds Pro',
    price: 129,
    condition: 'Good',
    location: 'Houston, TX',
    image: 'https://images.unsplash.com/photo-1695634463799-8cdf7a6a2595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb2RzJTIwZWFyYnVkc3xlbnwxfHx8fDE3Njc2MjM2NDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    brand: 'Samsung',
    category: 'Audio'
  }
];
