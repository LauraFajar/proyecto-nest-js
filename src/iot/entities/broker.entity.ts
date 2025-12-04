import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Broker extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  host: string;

  @Prop()
  username: string;

  @Prop()
  password: string;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ default: true })
  active: boolean;
}

export const BrokerSchema = SchemaFactory.createForClass(Broker);