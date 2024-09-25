import { FC, useState, useEffect } from 'react';
import { Invoice, ProductLine } from '../data/types';
import { initialInvoice, initialProductLine } from '../data/initialData';
import EditableInput from './EditableInput';
import EditableSelect from './EditableSelect';
import EditableTextarea from './EditableTextarea';
import EditableCalendarInput from './EditableCalendarInput';
import EditableFileImage from './EditableFileImage';
import countryList from '../data/countryList';
import Document from './Document';
import Page from './Page';
import View from './View';
import Text from './Text';
import { Font } from '@react-pdf/renderer';
import Download from './DownloadPDF';
import { format } from 'date-fns/format';

Font.register({
  family: 'Nunito',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/nunito/v12/XRXV3I6Li01BKofINeaE.ttf' },
    {
      src: 'https://fonts.gstatic.com/s/nunito/v12/XRXW3I6Li01BKofA6sKUYevN.ttf',
      fontWeight: 600,
    },
  ],
});

interface Props {
  data?: Invoice;
  pdfMode?: boolean;
  onChange?: (invoice: Invoice) => void;
}

const InvoicePage: FC<Props> = ({ data, pdfMode, onChange }) => {
  const [invoice, setInvoice] = useState<Invoice>(data ? { ...data } : { ...initialInvoice });
  const [subTotal, setSubTotal] = useState<number>();
  const [tax, setTax] = useState<number>();
  const [discount, setDiscount] = useState<number>();

  // State for managing tax and discount toggles and their values
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(false);
  const [taxValue, setTaxValue] = useState<number>(0);

  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(false);
  const [discountValue, setDiscountValue] = useState<number>(0);

  const dateFormat = 'MMM dd, yyyy';
  const invoiceDate = invoice.invoiceDate !== '' ? new Date(invoice.invoiceDate) : new Date();
  const invoiceDueDate =
    invoice.invoiceDueDate !== ''
      ? new Date(invoice.invoiceDueDate)
      : new Date(invoiceDate.valueOf());

  if (invoice.invoiceDueDate === '') {
    invoiceDueDate.setDate(invoiceDueDate.getDate() + 30);
  }

  const handleChange = (name: keyof Invoice, value: string | number) => {
    if (name !== 'productLines') {
      const newInvoice = { ...invoice };

      if (name === 'logoWidth' && typeof value === 'number') {
        newInvoice[name] = value;
      } else if (name !== 'logoWidth' && typeof value === 'string') {
        newInvoice[name] = value;
      }

      setInvoice(newInvoice);
    }
  };

  const handleProductLineChange = (index: number, name: keyof ProductLine, value: string) => {
    const productLines = invoice.productLines.map((productLine, i) => {
      if (i === index) {
        const newProductLine = { ...productLine };

        if (name === 'description') {
          newProductLine[name] = value;
        } else {
          if (
            value[value.length - 1] === '.' ||
            (value[value.length - 1] === '0' && value.includes('.'))
          ) {
            newProductLine[name] = value;
          } else {
            const n = parseFloat(value);

            newProductLine[name] = (n ? n : 0).toString();
          }
        }

        return newProductLine;
      }

      return { ...productLine };
    });

    setInvoice({ ...invoice, productLines });
  };

  const handleRemove = (i: number) => {
    const productLines = invoice.productLines.filter((_, index) => index !== i);

    setInvoice({ ...invoice, productLines });
  };

  const handleAdd = () => {
    const productLines = [...invoice.productLines, { ...initialProductLine }];

    setInvoice({ ...invoice, productLines });
  };

  const calculateAmount = (quantity: string, rate: string) => {
    const quantityNumber = parseFloat(quantity);
    const rateNumber = parseFloat(rate);
    const amount = quantityNumber && rateNumber ? quantityNumber * rateNumber : 0;

    return amount.toFixed(2);
  };

  // Calculate the subtotal whenever the product lines change
  useEffect(() => {
    let subTotal = 0;

    invoice.productLines.forEach((productLine) => {
      const quantityNumber = parseFloat(productLine.quantity);
      const rateNumber = parseFloat(productLine.rate);
      const amount = quantityNumber && rateNumber ? quantityNumber * rateNumber : 0;

      subTotal += amount;
    });

    setSubTotal(subTotal);
  }, [invoice.productLines]);

  // Calculate the tax and discount based on the toggle states and values
  useEffect(() => {
    if (isTaxEnabled && subTotal) {
      setTax((subTotal * taxValue) / 100);
    } else {
      setTax(0);
    }
  }, [subTotal, taxValue, isTaxEnabled]);

  useEffect(() => {
    if (isDiscountEnabled && subTotal) {
      setDiscount((subTotal * discountValue) / 100);
    } else {
      setDiscount(0);
    }
  }, [subTotal, discountValue, isDiscountEnabled]);

  useEffect(() => {
    if (onChange) {
      onChange(invoice);
    }
  }, [onChange, invoice]);

  return (
    <Document pdfMode={pdfMode}>
      <Page className="invoice-wrapper" pdfMode={pdfMode}>
        {!pdfMode && <Download data={invoice} setData={(d) => setInvoice(d)} />}

        <View className="flex" pdfMode={pdfMode}>
          <View className="w-50" pdfMode={pdfMode}>
            <EditableFileImage
              className="logo"
              placeholder="Your Logo"
              value={invoice.logo}
              width={invoice.logoWidth}
              pdfMode={pdfMode}
              onChangeImage={(value) => handleChange('logo', value)}
              onChangeWidth={(value) => handleChange('logoWidth', value)}
            />
            <EditableInput
              className="fs-20 bold"
              placeholder="Your Company"
              value={invoice.companyName}
              onChange={(value) => handleChange('companyName', value)}
              pdfMode={pdfMode}
            />
            <EditableInput
              placeholder="Your Name"
              value={invoice.name}
              onChange={(value) => handleChange('name', value)}
              pdfMode={pdfMode}
            />
            <EditableInput
              placeholder="Company's Address"
              value={invoice.companyAddress}
              onChange={(value) => handleChange('companyAddress', value)}
              pdfMode={pdfMode}
            />
            <EditableInput
              placeholder="City, State Zip"
              value={invoice.companyAddress2}
              onChange={(value) => handleChange('companyAddress2', value)}
              pdfMode={pdfMode}
            />
            <EditableSelect
              options={countryList}
              value={invoice.companyCountry}
              onChange={(value) => handleChange('companyCountry', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-50" pdfMode={pdfMode}>
            <EditableInput
              className="fs-45 right bold"
              placeholder="Invoice"
              value={invoice.title}
              onChange={(value) => handleChange('title', value)}
              pdfMode={pdfMode}
            />
          </View>
        </View>

        {/* Tax Toggle and Input */}
        <View className="flex mt-20" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <label>
              <input
                type="checkbox"
                checked={isTaxEnabled}
                onChange={() => setIsTaxEnabled(!isTaxEnabled)}
              />
              Enable Tax
            </label>
          </View>
          {isTaxEnabled && (
            <View className="w-50 p-5" pdfMode={pdfMode}>
              <label>Tax Percentage:</label>
              <input
                type="number"
                value={taxValue}
                onChange={(e) => setTaxValue(parseFloat(e.target.value))}
                min="0"
                max="100"
                placeholder="Enter tax %"
              />
            </View>
          )}
        </View>

        {/* Discount Toggle and Input */}
        <View className="flex mt-10" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <label>
              <input
                type="checkbox"
                checked={isDiscountEnabled}
                onChange={() => setIsDiscountEnabled(!isDiscountEnabled)}
              />
              Enable Discount
            </label>
          </View>
          {isDiscountEnabled && (
            <View className="w-50 p-5" pdfMode={pdfMode}>
              <label>Discount Percentage:</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                min="0"
                max="100"
                placeholder="Enter discount %"
              />
            </View>
          )}
        </View>

        {/* Subtotal, Tax, Discount, and Total Display */}
        <View className="flex mt-20" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <EditableInput
              value={invoice.subTotalLabel}
              onChange={(value) => handleChange('subTotalLabel', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <Text className="right bold dark" pdfMode={pdfMode}>
              {subTotal?.toFixed(2)}
            </Text>
          </View>
        </View>
        <View className="flex" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <EditableInput
              value={invoice.taxLabel}
              onChange={(value) => handleChange('taxLabel', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <Text className="right bold dark" pdfMode={pdfMode}>
              {tax?.toFixed(2)}
            </Text>
          </View>
        </View>
        <View className="flex" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <EditableInput
              value={invoice.discountLabel}
              onChange={(value) => handleChange('discountLabel', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <Text className="right bold dark" pdfMode={pdfMode}>
              -{discount?.toFixed(2)}
            </Text>
          </View>
        </View>
        <View className="flex bg-gray p-5" pdfMode={pdfMode}>
          <View className="w-50 p-5" pdfMode={pdfMode}>
            <EditableInput
              className="bold"
              value={invoice.totalLabel}
              onChange={(value) => handleChange('totalLabel', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-50 p-5 flex" pdfMode={pdfMode}>
            <EditableInput
              className="dark bold right ml-30"
              value={invoice.currency}
              onChange={(value) => handleChange('currency', value)}
              pdfMode={pdfMode}
            />
            <Text className="right bold dark w-auto" pdfMode={pdfMode}>
              {(
                typeof subTotal !== 'undefined' &&
                typeof tax !== 'undefined' &&
                typeof discount !== 'undefined'
                  ? subTotal + tax - discount
                  : 0
              ).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Continue with other sections as needed */}
      </Page>
    </Document>
  );
};

export default InvoicePage;
