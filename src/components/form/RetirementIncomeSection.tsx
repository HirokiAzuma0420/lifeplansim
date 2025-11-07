import { useState } from 'react';
import type { FormDataState, PersonalPensionPlan as PersonalPensionPlanType, OtherLumpSum as OtherLumpSumType } from '../../types/form-types';
export type { PersonalPensionPlanType as PersonalPensionPlan };
export type { OtherLumpSumType as OtherLumpSum };
import { Plus, Trash2 } from 'lucide-react';

interface RetirementIncomeSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  errors: Record<string, string>;
}

const FormSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
  <label className="flex items-center cursor-pointer">
    <span className="text-gray-700 text-sm font-bold mr-4">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; unit?: string }> = ({ label, name, value, onChange, error, unit, ...props }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>{label}</label>
    <div className="flex">
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      {unit && <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">{unit}</span>}
    </div>
    {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
  </div>
);

const FormNumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; unit?: string }> = (props) => <FormInput type="number" step="1" {...props} />;

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: React.ReactNode }> = ({ label, name, value, onChange, error, children }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${error ? 'border-red-500' : ''}`}>
      {children}
    </select>
    {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
  </div>
);

const PersonRetirementIncomeForm: React.FC<{
  personPrefix: '' | 'spouse';
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  errors: Record<string, string>;
}> = ({ personPrefix, formData, setFormData, errors }) => {

  const retirementIncomeKey = personPrefix ? 'spouseRetirementIncome' : 'retirementIncome';
  const hasRetirementIncome = !!formData[retirementIncomeKey];

  const pensionPlansKey = personPrefix ? 'spousePersonalPensionPlans' : 'personalPensionPlans';
  const hasPersonalPension = formData[pensionPlansKey] && formData[pensionPlansKey].length > 0;

  const otherLumpSumsKey = personPrefix ? 'spouseOtherLumpSums' : 'otherLumpSums';
  const hasOtherLumpSums = formData[otherLumpSumsKey] && formData[otherLumpSumsKey].length > 0;

  const handleSwitchChange = (key: keyof FormDataState, checked: boolean, initialData: object | null) => {
    setFormData(prev => ({
      ...prev,
      [key]: checked ? initialData : null,
    }));
  };

  const handleListSwitchChange = (key: keyof FormDataState, checked: boolean, initialData: object) => {
    setFormData(prev => ({
      ...prev,
      [key]: checked ? [initialData] : [],
    }));
  };

  const addListItem = (key: 'personalPensionPlans' | 'spousePersonalPensionPlans' | 'otherLumpSums' | 'spouseOtherLumpSums', initialData: object) => {
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], initialData],
    }));
  };

  const removeListItem = (key: 'personalPensionPlans' | 'spousePersonalPensionPlans' | 'otherLumpSums' | 'spouseOtherLumpSums', index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleListItemChange = (key: 'personalPensionPlans' | 'spousePersonalPensionPlans' | 'otherLumpSums' | 'spouseOtherLumpSums', index: number, field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const newList = [...prev[key]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [key]: newList };
    });
  };

  const handleObjectChange = (key: 'retirementIncome' | 'spouseRetirementIncome', field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* 退職金 */}
      <div className="p-4 border rounded-lg">
        <FormSwitch
          label="勤務先の退職金の受け取り予定はありますか？"
          checked={!!hasRetirementIncome}
          onChange={(checked: boolean) => handleSwitchChange(retirementIncomeKey, checked, { amount: '', age: '', yearsOfService: '' })}
        />
        {hasRetirementIncome && (
          <div className="mt-4 space-y-4 pl-4 border-l-2">
            <FormNumberInput unit="万円" name={`${retirementIncomeKey}.amount`} value={formData[retirementIncomeKey]?.amount || ''} onChange={(e) => handleObjectChange(retirementIncomeKey, 'amount', e.target.value)} label="受取額" error={errors[`${retirementIncomeKey}.amount`]} />
            <FormNumberInput unit="歳" name={`${retirementIncomeKey}.age`} value={formData[retirementIncomeKey]?.age || ''} onChange={(e) => handleObjectChange(retirementIncomeKey, 'age', e.target.value)} label="受取年齢" error={errors[`${retirementIncomeKey}.age`]} />
            <FormNumberInput unit="年" name={`${retirementIncomeKey}.yearsOfService`} value={formData[retirementIncomeKey]?.yearsOfService || ''} onChange={(e) => handleObjectChange(retirementIncomeKey, 'yearsOfService', e.target.value)} label="退職時点の勤続年数" error={errors[`${retirementIncomeKey}.yearsOfService`]} />
          </div>
        )}
      </div>

      {/* 個人年金 */}
      <div className="p-4 border rounded-lg">
        <FormSwitch
          label="個人年金保険の受け取り予定はありますか？"
          checked={hasPersonalPension}
          onChange={(checked: boolean) => handleListSwitchChange(pensionPlansKey, checked, { id: Date.now(), type: 'fixedTerm', amount: '', startAge: '', duration: '' })}
        />
        {hasPersonalPension && formData[pensionPlansKey].map((plan, index) => (
          <div key={plan.id} className="mt-4 space-y-4 pl-4 border-l-2 relative pb-10">
            <h4 className="font-semibold text-gray-700">プラン {index + 1}</h4>
            <FormSelect name={`${pensionPlansKey}.${index}.type`} value={plan.type} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'type', e.target.value)} label="受け取り方法">
              <option value="lumpSum">一括で受け取る</option>
              <option value="fixedTerm">決まった期間だけ受け取る</option>
              <option value="lifeTime">一生涯受け取る</option>
            </FormSelect>

            {plan.type === 'lumpSum' ? (
              <>
                <FormNumberInput unit="万円" name={`${pensionPlansKey}.${index}.amount`} value={plan.amount} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'amount', e.target.value)} label="受取総額" />
                <FormNumberInput unit="歳" name={`${pensionPlansKey}.${index}.startAge`} value={plan.startAge} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'startAge', e.target.value)} label="受取年齢" />
              </>
            ) : (
              <>
                <FormNumberInput unit="万円" name={`${pensionPlansKey}.${index}.amount`} value={plan.amount} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'amount', e.target.value)} label="年間受給額" />
                <FormNumberInput unit="歳" name={`${pensionPlansKey}.${index}.startAge`} value={plan.startAge} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'startAge', e.target.value)} label="受給開始年齢" />
                {plan.type === 'fixedTerm' && (
                  <FormNumberInput unit="年" name={`${pensionPlansKey}.${index}.duration`} value={plan.duration || ''} onChange={(e) => handleListItemChange(pensionPlansKey, index, 'duration', e.target.value)} label="受給期間" />
                )}
              </>
            )}
            <button type="button" onClick={() => removeListItem(pensionPlansKey, index)} className="absolute bottom-2 right-2 text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {hasPersonalPension && (
          <button type="button" onClick={() => addListItem(pensionPlansKey, { id: Date.now(), type: 'fixedTerm', amount: '', startAge: '', duration: '' })} className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800">
            <Plus size={16} className="mr-1" /> 個人年金プランを追加
          </button>
        )}
      </div>

      {/* その他一時金 */}
      <div className="p-4 border rounded-lg">
        <FormSwitch
          label="その他の一時金受け取り予定はありますか？"
          checked={hasOtherLumpSums}
          onChange={(checked) => handleListSwitchChange(otherLumpSumsKey, checked, { id: Date.now(), name: '', amount: '', age: '' })}
        />
        {hasOtherLumpSums && formData[otherLumpSumsKey].map((item, index) => (
          <div key={item.id} className="mt-4 space-y-4 pl-4 border-l-2 relative pb-10">
            <h4 className="font-semibold text-gray-700">一時金 {index + 1}</h4>
            <FormInput type="text" name={`${otherLumpSumsKey}.${index}.name`} value={item.name} onChange={(e) => handleListItemChange(otherLumpSumsKey, index, 'name', e.target.value)} label="名称" placeholder="例：財形貯蓄" />
            <FormNumberInput unit="万円" name={`${otherLumpSumsKey}.${index}.amount`} value={item.amount} onChange={(e) => handleListItemChange(otherLumpSumsKey, index, 'amount', e.target.value)} label="受取額" />
            <FormNumberInput unit="歳" name={`${otherLumpSumsKey}.${index}.age`} value={item.age} onChange={(e) => handleListItemChange(otherLumpSumsKey, index, 'age', e.target.value)} label="受取年齢" />
            <button type="button" onClick={() => removeListItem(otherLumpSumsKey, index)} className="absolute bottom-2 right-2 text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {hasOtherLumpSums && (
          <button type="button" onClick={() => addListItem(otherLumpSumsKey, { id: Date.now(), name: '', amount: '', age: '' })} className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800">
            <Plus size={16} className="mr-1" /> その他一時金を追加
          </button>
        )}
      </div>
    </div>
  );
};

export default function RetirementIncomeSection({ formData, setFormData, errors }: RetirementIncomeSectionProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'spouse'>('main');
  const showSpouseTab = formData.familyComposition === '既婚' || formData.planToMarry === 'する';

  return (
    <div className="space-y-6">
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-retirement_allowance.png" alt="Retirement Allowance" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">退職・年金に関する質問</h2>
      <p className="text-sm text-gray-600">
        退職金や個人年金など、老後に受け取る予定の一時金や年金収入について入力してください。
        企業型DC（企業型確定拠出年金）は、iDeCoと合算して「投資」セクションで入力してください。
      </p>

      {showSpouseTab && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`${
                activeTab === 'main'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              あなた
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spouse')}
              className={`${
                activeTab === 'spouse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              パートナー
            </button>
          </nav>
        </div>
      )}

      <div>
        {activeTab === 'main' && (
          <PersonRetirementIncomeForm
            personPrefix=""
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {activeTab === 'spouse' && showSpouseTab && (
          <PersonRetirementIncomeForm
            personPrefix="spouse"
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
      </div>
    </div>
  );
}