import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('tratamientos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createTratamientoDto: CreateTratamientoDto) {
    return this.tratamientosService.create(createTratamientoDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll(@Query('epaId') epaId?: string) {
    if (epaId) {
      return this.tratamientosService.findByEpaId(+epaId);
    }
    return this.tratamientosService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.tratamientosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateTratamientoDto: UpdateTratamientoDto) {
    return this.tratamientosService.update(+id, updateTratamientoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.tratamientosService.remove(+id);
  }
}