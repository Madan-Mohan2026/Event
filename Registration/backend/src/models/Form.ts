import { Schema, model, Document } from 'mongoose';

export interface IFormItem {
  name: string;
  label: string;
  type: string;
  fieldType?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface IForm extends Document {
  title: string;
  description?: string;
  eventId?: string;
  formSchema: IFormItem[];
  fields: IFormItem[];
  regsCount?: number;
  responsesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const formSchema = new Schema<IForm>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  eventId: { type: String, default: null },
  formSchema: [{ type: Schema.Types.Mixed }],
  fields: [{ type: Schema.Types.Mixed }],
  regsCount: { type: Number, default: 0 },
  responsesCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Form = model<IForm>('Form', formSchema);
