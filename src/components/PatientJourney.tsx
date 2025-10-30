import { FaArrowRight } from 'react-icons/fa';

export default function PatientJourney() {
  const steps = [
    {
      number: '1',
      title: 'Enter Details',
      subtitle: 'Provide your basic information.'
    },
    {
      number: '2',
      title: 'Upload Reports',
      subtitle: 'Share your medical records.'
    },
    {
      number: '3',
      title: 'Get Token',
      subtitle: 'Receive instant appointment token.'
    },
    {
      number: '4',
      title: 'Track Queue',
      subtitle: 'Monitor estimated waiting time.'
    }
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-poppins font-bold text-[#333333] mb-4">
            Simple Patient Journey
          </h2>
          <p className="text-xl text-[#333333] font-roboto">
            Book your appointment in just 4 easy steps
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 w-64 h-48 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#007BFF] text-white rounded-full flex items-center justify-center text-2xl font-poppins font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-poppins font-semibold text-[#333333] mb-2">
                  {step.title}
                </h3>
                <p className="text-[#333333] font-roboto text-sm">
                  {step.subtitle}
                </p>
              </div>
              {index < steps.length - 1 && (
                <FaArrowRight className="text-[#007BFF] text-3xl mx-4 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
