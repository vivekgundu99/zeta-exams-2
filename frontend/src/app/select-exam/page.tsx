'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';

export default function SelectExamPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<'jee' | 'neet' | null>(null);

  const exams = [
    {
      id: 'jee',
      icon: '🎯',
      title: 'JEE Main',
      subtitle: 'Joint Entrance Examination (Main)',
      description: 'Engineering entrance exam for IITs, NITs, and other technical institutes',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      pattern: '90 Questions | 180 Minutes | 300 Marks',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'neet',
      icon: '🏥',
      title: 'NEET',
      subtitle: 'National Eligibility cum Entrance Test',
      description: 'Medical entrance exam for MBBS, BDS, and other medical courses',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      pattern: '180 Questions | 180 Minutes | 720 Marks',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const handleContinue = () => {
    if (!selected) {
      toast.error('Please select an exam');
      return;
    }
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-3">Choose Your Exam</h1>
          <p className="text-xl text-gray-600">Select the exam you're preparing for</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {exams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => setSelected(exam.id as any)}
              className={`
                bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300
                ${selected === exam.id 
                  ? 'ring-4 ring-purple-500 scale-105' 
                  : 'hover:shadow-2xl hover:scale-102'}
              `}
            >
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${exam.gradient} mb-4`}>
                  <span className="text-4xl">{exam.icon}</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                <p className="text-gray-600">{exam.subtitle}</p>
              </div>

              <p className="text-gray-700 mb-6">{exam.description}</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Subjects:</h3>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map((subject) => (
                      <span key={subject} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 font-medium">{exam.pattern}</p>
                </div>
              </div>

              <Button
                fullWidth
                className="mt-6"
                variant={selected === exam.id ? 'primary' : 'outline'}
              >
                {selected === exam.id ? '✓ Selected' : `Select ${exam.title}`}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={handleContinue} disabled={!selected}>
            Continue to Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}