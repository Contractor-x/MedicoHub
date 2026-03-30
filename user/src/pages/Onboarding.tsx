import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { ChevronRight, Check, Plus, X, Building2, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

interface OnboardingProps {
  updateUser: (data: any) => void;
}

const NIGERIAN_MEDICAL_SCHOOLS = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "University of Benin (UNIBEN)",
  "Lagos State University (LASU)",
  "University of Ilorin (UNILORIN)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "University of Port Harcourt (UNIPORT)",
  "University of Calabar (UNICAL)",
  "University of Jos (UNIJOS)",
  "Bayero University Kano (BUK)",
  "Usman Danfodio University, Sokoto (UDUS)",
  "University of Maiduguri (UNIMAID)",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Olabisi Onabanjo University (OOU)",
  "Ambrose Alli University (AAU)",
  "Abia State University (ABSU)",
  "Delta State University (DELSU)",
  "Ebonyi State University (EBSU)",
  "Niger Delta University (NDU)",
  "Benue State University (BSU)",
  "Imo State University (IMSU)",
  "Enugu State University of Science and Technology (ESUT)",
  "Kaduna State University (KASU)",
  "Kogi State University (KSU)",
  "Kwara State University (KWASU)",
  "Ekiti State University (EKSU)",
  "Osun State University (UNIOSUN)",
  "Babcock University",
  "Igbinedion University",
  "Madonna University",
  "Bowen University",
  "Afe Babalola University (ABUAD)",
  "Bingham University",
  "Nile University of Nigeria",
  "Gregory University, Uturu",
  "PAMO University of Medical Sciences",
  "Eko University of Medicine and Health Sciences",
  "University of Abuja",
  "Gombe State University",
  "Rivers State University",
  "Chukwuemeka Odumegwu Ojukwu University"
];

export const Onboarding: React.FC<OnboardingProps> = ({ updateUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    academicYear: '',
    schoolName: '',
    weakness: [] as string[],
    currentCourses: [] as string[]
  });

  // Logic for Course Addition from Profile.tsx
  const [courseInput, setCourseInput] = React.useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);
  const courseDropdownRef = React.useRef<HTMLDivElement>(null);

  // Logic for School Selection
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);
  const schoolDropdownRef = React.useRef<HTMLDivElement>(null);

  const PREDEFINED_COURSES = [
    'Gross Anatomy',
    'Embryology',
    'Histology',
    'Physiology',
    'Biochemistry',
    'Pathology',
    'Pharmacology'
  ];

  const filteredCourses = PREDEFINED_COURSES.filter(
    c => c.toLowerCase().includes(courseInput.toLowerCase()) &&
      !formData.currentCourses.includes(c)
  );

  const exactMatch = filteredCourses.some(c => c.toLowerCase() === courseInput.trim().toLowerCase());
  const showManualOption = courseInput.trim().length > 0 && !exactMatch;

  // Filter Schools
  const filteredSchools = NIGERIAN_MEDICAL_SCHOOLS.filter(
    s => s.toLowerCase().includes(formData.schoolName.toLowerCase())
  );

  const addCourse = (courseName: string) => {
    const trimmedName = courseName.trim();
    if (trimmedName && !formData.currentCourses.includes(trimmedName)) {
      setFormData(prev => ({
        ...prev,
        currentCourses: [...prev.currentCourses, trimmedName]
      }));
      setCourseInput('');
      setIsCourseDropdownOpen(false);
    }
  };

  const removeCourse = (courseToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      currentCourses: prev.currentCourses.filter(c => c !== courseToRemove)
    }));
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateUser(formData);
      // Determine where to go next based on subscription flow.
      // Usually, users would have gone through subscription setup before OR after.
      // If we are here, we assume user is set up and go to Dashboard.
      navigate(AppRoute.DASHBOARD);
    }
  };



  const [years, setYears] = React.useState(['Year 2', 'Year 3', 'Year 4']);

  React.useEffect(() => {
    const fetchYears = async () => {
      try {
        const data = await api.settings.get();
        if (data && data.academicYears) {
          // Filter out 'General' as it's a default/invalid year for a completed profile
          setYears(data.academicYears.filter((y: string) => y !== 'General'));
        }
      } catch (error) {
        console.error("Failed to fetch academic years from MongoDB:", error);
      }
    };
    fetchYears();
  }, []);
  const subjects = PREDEFINED_COURSES;

  const toggleWeakness = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      weakness: prev.weakness.includes(subject)
        ? prev.weakness.filter(w => w !== subject)
        : [...prev.weakness, subject]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 pt-28 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {step === 1 && "Current Stage"}
            {step === 2 && "Courses Offered"}
            {step === 3 && "Challenging Subjects"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {step} of 3
          </p>
        </div>


        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 min-h-[400px] flex flex-col justify-between">

          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div ref={schoolDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical School</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => {
                      setFormData({ ...formData, schoolName: e.target.value });
                      setIsSchoolDropdownOpen(true);
                    }}
                    onFocus={() => setIsSchoolDropdownOpen(true)}
                    placeholder="Search or type your school..."
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                  >
                    <ChevronDown size={20} />
                  </button>

                  {/* School Dropdown */}
                  {isSchoolDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-60 overflow-y-auto">
                      {filteredSchools.map((school) => (
                        <button
                          key={school}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, schoolName: school });
                            setIsSchoolDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-50 last:border-0 block"
                        >
                          {school}
                        </button>
                      ))}
                      {filteredSchools.length === 0 && (
                        <div className="px-4 py-3 text-gray-400 text-sm italic">
                          No matches. You can continue typing to add manually.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select your academic year</label>
                <div className="grid grid-cols-1 gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setFormData({ ...formData, academicYear: year })}
                      className={`flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-medium transition-all ${formData.academicYear === year
                        ? 'border-brand-blue bg-blue-50 text-brand-blue ring-1 ring-brand-blue'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {year}
                      {formData.academicYear === year && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up" ref={courseDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">What courses are you taking?</label>
              <div className="relative">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={courseInput}
                    onChange={(e) => {
                      setCourseInput(e.target.value);
                      setIsCourseDropdownOpen(true);
                    }}
                    onFocus={() => setIsCourseDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCourse(courseInput);
                      }
                    }}
                    placeholder="Type to search..."
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => addCourse(courseInput)}
                    className="bg-brand-dark text-white px-3 rounded-xl hover:bg-black transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {isCourseDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-48 overflow-y-auto">
                    {filteredCourses.map(course => (
                      <button
                        key={course}
                        type="button"
                        onClick={() => addCourse(course)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-50 last:border-0 flex justify-between items-center group"
                      >
                        {course}
                        <Plus size={16} className="text-gray-300 group-hover:text-brand-blue" />
                      </button>
                    ))}

                    {showManualOption && (
                      <button
                        type="button"
                        onClick={() => addCourse(courseInput)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 font-medium text-brand-blue border-t border-gray-100 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add "{courseInput}" manually
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.currentCourses.map((course, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 text-brand-blue px-3 py-1.5 rounded-lg font-bold text-sm">
                    {course}
                    <button
                      type="button"
                      onClick={() => removeCourse(course)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {formData.currentCourses.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No courses added yet.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Which subjects do you find challenging?</label>
                <div className="grid grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleWeakness(subject)}
                      className={`px-3 py-3 border rounded-xl text-sm font-medium transition-all text-center ${formData.weakness.includes(subject)
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all hover:shadow-lg"
            >
              {step === 3 ? "Complete Profile" : "Next"}
              {step !== 3 && <ChevronRight className="ml-2 w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};