import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CultivosService } from './cultivos.service';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('cultivos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CultivosController {
  constructor(private readonly cultivosService: CultivosService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createCultivoDto: CreateCultivoDto) {
    return this.cultivosService.create(createCultivoDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.cultivosService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.cultivosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateCultivoDto: UpdateCultivoDto) {
    return this.cultivosService.update(+id, updateCultivoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.cultivosService.remove(+id);
  }
}
