import React from 'react';
import { Sparkles, MessageCircle, HelpCircle, Target } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>عمادة شؤون الطلاب</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            عن الجلسات الحوارية
          </h2>
          <p className="text-xl font-bold text-blue-600 mt-2 font-sans">
            “تجربة تبدأ بسؤال… وتنتهي بمنظور جديد”
          </p>
        </div>

        {/* Core Philosophy Box */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 mb-12 relative overflow-hidden text-right">
          <div className="relative space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              تجربة حوارية إرشادية للطلبة المستجدين
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              الجلسات الحوارية لأسبوع المستجدين مصممة خصيصاً لتكون منصة إرشادية وتفاعلية حية موجهة للطلاب والطالبات المستجدين في عمادة شؤون الطلاب، لتقديم تجربة ملهمة تعتمد على تجارب الضيوف واستشاراتهم الأكاديمية والنفسية.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">تجارب واقعية ملهمة</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              مشاركة قصص حقيقية وتوجيهات عملية من نخبة المرشدين والأكاديميين حول التحديات والحلول في الحياة الجامعية.
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">استشارات وإجابة تساؤلات</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              فرصة مباشرة لطرح الأسئلة والحصول على إجابات موثوقة تساعد الطالب على التكيف السريع والتفوق.
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">جاهزية من اليوم الأول</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تزويد الطالب بالأدوات العملية لتنظيم الوقت، رفع المعدل، واستكشاف التخصص وبناء المسار الأكاديمي.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
