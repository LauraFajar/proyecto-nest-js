import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EpaService } from './epa.service';
import { CreateEpaDto } from './dto/create-epa.dto';
import { UpdateEpaDto } from './dto/update-epa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('epa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EpaController {
  constructor(private readonly epaService: EpaService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createEpaDto: CreateEpaDto) {
    return this.epaService.create(createEpaDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.epaService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.epaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateEpaDto: UpdateEpaDto) {
    return this.epaService.update(+id, updateEpaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.epaService.remove(+id);
  }
}
