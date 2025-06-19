import React from 'react';

const FormPage: React.FC = () => {
  return (
    <div
      className="relative flex min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}
    >
      <header className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
        <h2 className="text-[#0e141b] text-lg font-bold flex-1 text-center pl-12">新しいシミュレーション</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="h-12 text-[#0e141b]">
            ✕
          </button>
        </div>
      </header>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">年齢の設定</h1>
        <InputField label="現在の年齢" />
        <InputField label="退職予定年齢" />
      </section>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">収支の設定</h1>
        <InputField label="年間収入（円）" />
        <InputField label="年間支出（円）" />
      </section>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">積立の設定</h1>
        <InputField label="NISA 積立額（円）" />
        <InputField label="iDeCo 積立額（円）" />
      </section>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">利回りの設定</h1>
        <InputField label="株式市場の利回り（％）" />
        <InputField label="債券の利回り（％）" />
      </section>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">シナリオ設定</h1>
        <InputField label="インフレ率（％）" />
        <InputField label="医療費の増加率（％）" />
      </section>

      <section className="px-4 py-5">
        <h1 className="text-xl font-bold text-left mb-4">取り崩しの設定</h1>
        <InputField label="初期取り崩し率（％）" />
      </section>

      <footer className="px-4 py-5">
        <button className="w-full h-12 rounded-xl bg-[#1980e6] text-white text-base font-bold">
          シミュレーションを実行
        </button>
      </footer>
    </div>
  );
};

type InputFieldProps = {
  label: string;
};

const InputField: React.FC<InputFieldProps> = ({ label }) => (
  <div className="mb-4">
    <label className="block text-[#0e141b] text-base font-medium mb-2">{label}</label>
    <input
      type="text"
      className="form-input w-full h-14 rounded-xl bg-[#e7edf3] p-4 text-[#0e141b] placeholder:text-[#4e7397] focus:outline-none"
      placeholder="入力してください"
    />
  </div>
);

export default FormPage;
