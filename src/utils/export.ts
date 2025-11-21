import * as XLSX from 'xlsx';
import type { YearlyData, SimulationInputParams, InvestmentProduct } from '../types/simulation-types';

// --- キーと日本語名のマッピング ---

const yearlyDataKeyMap: Record<string, string> = {
  year: '年',
  age: '年齢',
  spouseAge: '配偶者年齢',
  income: '年間収入',
  expense: '年間支出',
  balance: '年間収支',
  investedAmount: '年間投資額',
  savings: '現金預金',
  investmentPrincipal: '投資元本（全体）',
  totalAssets: '総資産',
  'incomeDetail_self': '収入_本人',
  'incomeDetail_spouse': '収入_配偶者',
  'incomeDetail_investment': '収入_資産運用',
  'incomeDetail_oneTime': '収入_一時金',
  'incomeDetail_publicPension': '収入_公的年金',
  'incomeDetail_personalPension': '収入_個人年金',
  'expenseDetail_living': '支出_生活費',
  'expenseDetail_car': '支出_自動車',
  'expenseDetail_housing': '支出_住居費',
  'expenseDetail_marriage': '支出_結婚',
  'expenseDetail_children': '支出_子供',
  'expenseDetail_appliances': '支出_家電',
  'expenseDetail_care': '支出_介護',
  'expenseDetail_retirementGap': '支出_老後資金',
  'nisa_principal': 'NISA元本',
  'nisa_balance': 'NISA評価額',
  'ideco_principal': 'iDeCo元本',
  'ideco_balance': 'iDeCo評価額',
  'taxable_principal': '課税口座元本',
  'taxable_balance': '課税口座評価額',
  'assetAllocation_cash': '資産配分_現金',
  'assetAllocation_investment': '資産配分_投資全体',
  'assetAllocation_nisa': '資産配分_NISA',
  'assetAllocation_ideco': '資産配分_iDeCo',
};

const inputParamsKeyMap: Record<string, string> = {
    initialAge: '現在年齢',
    spouseInitialAge: '配偶者の現在年齢',
    endAge: 'シミュレーション終了年齢',
    retirementAge: '退職年齢',
    spouseRetirementAge: '配偶者の退職年齢',
    pensionStartAge: '年金受給開始年齢',
    spousePensionStartAge: '配偶者の年金受給開始年齢',
    mainJobIncomeGross: '本人の年収（主）',
    sideJobIncomeGross: '本人の年収（副）',
    spouseMainJobIncomeGross: '配偶者の年収（主）',
    spouseSideJobIncomeGross: '配偶者の年収（副）',
    incomeGrowthRate: '本人の昇給率',
    spouseIncomeGrowthRate: '配偶者の昇給率',
    livingCostSimpleAnnual: '年間生活費',
    currentSavingsJPY: '現在の預金額',
    emergencyFundJPY: '生活防衛費',
    // ... 他の入力パラメータも同様に追加
};


// --- ヘルパー関数 ---

const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }
  return Object.keys(obj).reduce((acc: Record<string, unknown>, k: string) => {
    const pre = prefix.length ? prefix + '_' : '';
    const key = pre + k;
    const value = obj[k];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value as Record<string, unknown>, key));
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const renameKeys = (obj: Record<string, unknown>, keyMap: Record<string, string>): Record<string, unknown> => {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
        const newKey = keyMap[key] || key;
        acc[newKey] = obj[key];
        return acc;
    }, {});
};


// --- データ処理関数 ---

const processYearlyDataForSheet = (yearlyData: YearlyData[]) => {
  return yearlyData.map(d => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { debug, products, ...rest } = d;
    const flattened = flattenObject(rest);
    const renamed = renameKeys(flattened, yearlyDataKeyMap);
    return renamed;
  });
};

const processProductsForSheet = (yearlyData: YearlyData[]) => {
    const productsData: Record<string, string | number>[] = [];
    yearlyData.forEach(d => {
        if(d.products) {
            Object.entries(d.products).forEach(([productKey, bucket]) => {
                productsData.push({
                    '年': d.year,
                    '年齢': d.age,
                    '商品キー': productKey,
                    '元本': bucket.principal,
                    '評価額': bucket.balance,
                });
            });
        }
    });
    return productsData;
};

const processInputParamsForSheet = (inputParams: SimulationInputParams & { products?: InvestmentProduct[] }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { products, _testOverrides, ...rest } = inputParams;
    const flattened = flattenObject(rest as Record<string, unknown>);
    const renamed = renameKeys(flattened, inputParamsKeyMap);
    return Object.entries(renamed).map(([key, value]) => ({
        'パラメータ': key,
        '値': typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
    }));
}


// --- メインエクスポート関数 ---

export const exportToExcel = (
    yearlyData: YearlyData[],
    inputParams: SimulationInputParams & { products?: InvestmentProduct[] },
    fileName: string = 'simulation_result.xlsx'
) => {
  if (!yearlyData || yearlyData.length === 0) {
    console.error('No data to export.');
    return;
  }

  // 1. データシートを生成
  const processedYearlyData = processYearlyDataForSheet(yearlyData);
  const processedProductsData = processProductsForSheet(yearlyData);
  const processedInputParams = processInputParamsForSheet(inputParams);

  // 2. json_to_sheetでワークシートに変換
  const wsYearlySummary = XLSX.utils.json_to_sheet(processedYearlyData);
  const wsProductsDetail = XLSX.utils.json_to_sheet(processedProductsData);
  const wsInputParams = XLSX.utils.json_to_sheet(processedInputParams);

  // 3. 新しいワークブックを作成
  const wb = XLSX.utils.book_new();

  // 4. ワークブックにシートを追加
  XLSX.utils.book_append_sheet(wb, wsYearlySummary, '年次データサマリー');
  XLSX.utils.book_append_sheet(wb, wsProductsDetail, '商品別資産詳細');
  XLSX.utils.book_append_sheet(wb, wsInputParams, '入力パラメータ');

  // 5. ワークブックを書き出してダウンロードをトリガー
  XLSX.writeFile(wb, fileName);
};


import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (elementIds: string[], fileName: string = 'simulation_report.pdf') => {
  const loader = document.createElement('div');
  loader.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <div style="color: white; font-size: 20px; margin-bottom: 10px;">PDFを生成中...</div>
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite;"></div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    </div>
  `;
  document.body.appendChild(loader);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const effectivePageWidth = pageWidth - margin * 2;
    let y = margin;

    for (let i = 0; i < elementIds.length; i++) {
      const element = document.getElementById(elementIds[i]);
      if (!element) {
        console.warn(`Element with id "${elementIds[i]}" not found.`);
        continue;
      }

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgWidth / imgHeight;
      const pdfImgWidth = effectivePageWidth;
      const pdfImgHeight = pdfImgWidth / aspectRatio;

      if (y + pdfImgHeight > pageHeight - margin && i > 0) {
        pdf.addPage();
        y = margin;
      }
      
      pdf.addImage(imgData, 'PNG', margin, y, pdfImgWidth, pdfImgHeight);
      y += pdfImgHeight + 10; // Add some space between images
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDFの生成に失敗しました。');
  } finally {
    document.body.removeChild(loader);
  }
};

