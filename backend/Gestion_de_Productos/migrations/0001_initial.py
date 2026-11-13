import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('Gestion_de_Proveedores', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Producto',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('nombre', models.CharField(max_length=200)),
                ('categoria', models.CharField(max_length=100)),
                ('marca', models.CharField(default='Sin marca', max_length=100)),
                (
                    'precio',
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(0.01)],
                    ),
                ),
                ('stock', models.PositiveIntegerField(default=0)),
                (
                    'estado',
                    models.CharField(
                        choices=[('activo', 'Activo'), ('inactivo', 'Inactivo')],
                        default='activo',
                        max_length=8,
                    ),
                ),
                (
                    'proveedores',
                    models.ManyToManyField(
                        blank=True,
                        related_name='productos',
                        to='Gestion_de_Proveedores.proveedor',
                    ),
                ),
            ],
            options={
                'ordering': ['nombre'],
            },
        ),
    ]
