import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterCard } from './components/FilterCard';
import { ResultsCount } from './components/ResultsCount';
import { ListingsGrid } from './components/ListingsGrid';
import { mockListings, FilterQuestion, Listing } from './data/mockData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [filteredListings, setFilteredListings] = useState<Listing[]>(mockListings);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const questions: FilterQuestion[] = [
    {
      id: 'brand',
      question: 'What brand are you looking for?',
      options: ['Any', 'Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'Sony']
    },
    {
      id: 'condition',
      question: 'What condition works for you?',
      options: ['Any', 'Like New', 'Excellent', 'Good', 'Fair']
    },
    {
      id: 'priceRange',
      question: 'What\'s your budget?',
      options: ['Any', 'Under $200', '$200-$500', '$500-$1000', 'Over $1000']
    },
    {
      id: 'category',
      question: 'Which category are you interested in?',
      options: ['Any', 'Laptops', 'Smartphones', 'Tablets', 'Audio', 'Cameras']
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setEditingQuestionId(null);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    setEditingQuestionId(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    }
  };

  const handleSkip = (questionId: string) => {
    const newAnswers = { ...answers, [questionId]: 'Any' };
    setAnswers(newAnswers);
    setEditingQuestionId(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  const handleRemoveAnswer = (questionId: string) => {
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);
    setEditingQuestionId(null);
  };

  // Filter listings based on search query and answers
  useEffect(() => {
    let filtered = mockListings;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by brand
    if (answers.brand && answers.brand !== 'Any') {
      filtered = filtered.filter(listing => listing.brand === answers.brand);
    }

    // Filter by condition
    if (answers.condition && answers.condition !== 'Any') {
      filtered = filtered.filter(listing => listing.condition === answers.condition);
    }

    // Filter by price range
    if (answers.priceRange && answers.priceRange !== 'Any') {
      filtered = filtered.filter(listing => {
        const price = listing.price;
        switch (answers.priceRange) {
          case 'Under $200':
            return price < 200;
          case '$200-$500':
            return price >= 200 && price <= 500;
          case '$500-$1000':
            return price >= 500 && price <= 1000;
          case 'Over $1000':
            return price > 1000;
          default:
            return true;
        }
      });
    }

    // Filter by category
    if (answers.category && answers.category !== 'Any') {
      filtered = filtered.filter(listing => listing.category === answers.category);
    }

    setFilteredListings(filtered);
  }, [searchQuery, answers]);

  const answeredQuestionsCount = Object.keys(answers).length;
  const shouldBlurResults = hasSearched && answeredQuestionsCount < 2;

  // Determine which question to show
  const activeQuestion = editingQuestionId 
    ? questions.find(q => q.id === editingQuestionId)
    : questions[currentQuestionIndex];

  // Get answered filters (excluding 'Any')
  const answeredFilters = Object.entries(answers)
    .filter(([_, answer]) => answer !== 'Any')
    .map(([questionId, answer]) => ({
      questionId,
      answer,
      label: questions.find(q => q.id === questionId)?.question || ''
    }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - Compact */}
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Search Section */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Guided Filtering Card - Only show current/editing question */}
          {hasSearched && activeQuestion && (editingQuestionId || currentQuestionIndex < questions.length) && (
            <div className="mb-6">
              <FilterCard
                question={activeQuestion}
                isActive={true}
                answer={answers[activeQuestion.id]}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
              />
            </div>
          )}

          {/* Active Filters - Show as buttons */}
          {hasSearched && answeredFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {answeredFilters.map(({ questionId, answer }) => (
                <button
                  key={questionId}
                  onClick={() => handleEditAnswer(questionId)}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors flex items-center gap-2"
                >
                  <span>{answer}</span>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAnswer(questionId);
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        {hasSearched && (
          <ResultsCount count={filteredListings.length} />
        )}

        {/* Listings Grid */}
        <ListingsGrid 
          listings={filteredListings} 
          shouldBlur={shouldBlurResults}
          hasSearched={hasSearched}
        />
      </div>
    </div>
  );
}