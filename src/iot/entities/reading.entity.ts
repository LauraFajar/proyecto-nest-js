import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Reading extends Document {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Number })
  temperature: number;

  @Prop({ type: Number })
  humidity: number;

  @Prop({ type: Number })
  soilHumidity: number;
}

export const ReadingSchema = SchemaFactory.createForClass(Reading);