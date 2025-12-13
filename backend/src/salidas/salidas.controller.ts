import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('salidas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalidasController {
  constructor(private readonly salidasService: SalidasService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createSalidaDto: CreateSalidaDto) {
    return this.salidasService.create(createSalidaDto);
  }

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.salidasService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  findOne(@Param('id') id: string) {
    return this.salidasService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateSalidaDto: UpdateSalidaDto) {
    return this.salidasService.update(+id, updateSalidaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.salidasService.remove(+id);
  }
}
