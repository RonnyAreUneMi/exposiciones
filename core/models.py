from django.db import models

class Presentation(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='presentations/')
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Slide(models.Model):
    presentation = models.ForeignKey(Presentation, related_name='slides', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='slides/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
