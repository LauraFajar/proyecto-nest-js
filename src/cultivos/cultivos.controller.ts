import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards,HttpCode,HttpStatus} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CultivosService } from './cultivos.service';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Controller('cultivos')
@UseGuards(AuthGuard('jwt'))
export class CultivosController {
  constructor(private readonly cultivosService: CultivosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCultivoDto: CreateCultivoDto) {
    return this.cultivosService.create(createCultivoDto);
  }

  @Get()
  findAll() {
    return this.cultivosService.findAll();
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.cultivosService.getEstadisticas();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateCultivoDto: UpdateCultivoDto
  ) {
    return this.cultivosService.update(id, updateCultivoDto);
  }

  @Delete('id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.remove(id);
  }
}
