import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Sensor extends Document {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  crop: string;

  @Prop()
  tipo_sensor: string;

  @Prop()
  unidad_medida: string;

  @Prop({ default: 0 })
  valor_actual: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now })
  lastUpdate: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SensorSchema = SchemaFactory.createForClass(Sensor);
