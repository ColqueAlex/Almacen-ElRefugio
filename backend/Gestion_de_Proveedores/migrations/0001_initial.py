from django.db import migrations, models
from django.db.models.functions import Lower


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Proveedor',
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
                ('numero_telefono', models.CharField(blank=True, max_length=30)),
                ('tipo_productos', models.CharField(max_length=200)),
                ('activo', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['nombre'],
                'constraints': [
                    models.UniqueConstraint(
                        Lower('nombre'),
                        name='proveedor_nombre_case_insensitive_unico',
                    ),
                ],
            },
        ),
    ]
