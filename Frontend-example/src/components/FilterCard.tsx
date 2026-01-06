import React from 'react';
import { FilterQuestion } from '../data/mockData';

interface FilterCardProps {
  question: FilterQuestion;
  isActive: boolean;
  answer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  onSkip: (questionId: string) => void;
}

export function FilterCard({ question, isActive, answer, onAnswer, onSkip }: FilterCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white border border-neutral-300 rounded-xl shadow-sm transition-all duration-300">
      <h3 className="text-base mb-4 text-neutral-900">
        {question.question}
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(question.id, option)}
            className={`px-4 py-2 border rounded-lg text-sm transition-all ${
              answer === option
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSkip(question.id)}
        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}